# LyfeLens ML Model Training — Complete Hand-Off Guide
# ======================================================
# Give this file to your teammate. They follow it step-by-step.
# They give you back ONE file: `lyfelens_model.onnx`
# You drop it into the backend and it works.

# ======================================================
# PART 1: UNDERSTAND THE FULL SYSTEM
# ======================================================

# THE PROBLEM:
# Our app points the phone camera at an emergency scene.
# We need to answer TWO questions:
#   1. WHERE is the person? (body localization + pose)
#   2. WHAT is the injury? (bleeding, burns, stroke, or normal)
#
# QUESTION 1 is already solved — MoveNet (Google's pose model) gives us
# 17 body keypoints (nose, shoulders, wrists, hips, etc.) every frame.
# We use those keypoints for:
#   - CPR detection: person lying flat (all keypoints same Y level)
#   - Choking: wrists near throat (wrist.y ≈ nose.y)
#   - Seizure: rapid keypoint oscillation between frames
#
# QUESTION 2 is what THIS MODEL solves — visual injury classification.
# The model takes a camera image and outputs: BLEEDING, BURNS, STROKE, or NORMAL
#
# WHAT HAPPENS AFTER DETECTION:
# The condition code (e.g., "BLEEDING") maps to a PRE-BUILT instruction database
# already coded in the app (HUD_DATABASE in index.tsx + voiceGuide.ts).
# These contain step-by-step first aid instructions + voice guidance.
# The model does NOT generate instructions — it only classifies.
# Instructions are hardcoded by us because medical advice must be verified by humans.

# ======================================================
# PART 2: DATASET PREPARATION
# ======================================================

# STEP 1: Download these datasets from Kaggle (free account needed)
#
# Dataset 1 (PRIMARY — 2000+ wound images):
#   https://www.kaggle.com/datasets/ibrahimfateen/collected-and-categorized-wound-images-dataset
#
# Dataset 2 (Expert-validated — 432 images):
#   https://www.kaggle.com/datasets/yasinpratomo/wound-dataset
#
# Dataset 3 (Burns specific — 1300 images):
#   https://www.kaggle.com/datasets/gpiosenka/skin-burn-dataset
#
# Dataset 4 (Normal faces — for stroke vs normal):
#   Search Kaggle for "facial palsy grading" for drooping faces
#   Use any "faces" dataset for normal faces

# STEP 2: Organize into this EXACT folder structure:
#
# lyfelens_dataset/
# ├── train/
# │   ├── bleeding/       ← 200+ images (cuts, lacerations, wounds, stab wounds)
# │   ├── burns/          ← 200+ images (all burn degrees)
# │   ├── stroke_face/    ← 100+ images (facial drooping, asymmetric faces)
# │   └── normal/         ← 200+ images (healthy skin, normal people)
# └── val/
#     ├── bleeding/       ← 40+ images (DIFFERENT from training images!)
#     ├── burns/          ← 40+ images
#     ├── stroke_face/    ← 20+ images
#     └── normal/         ← 40+ images
#
# CRITICAL RULES:
# - Train and val images MUST be different images (no overlap!)
# - Remove blurry, watermarked, or cartoon images
# - Include diverse lighting conditions (indoor, outdoor, flash, dark)
# - Include different skin tones
# - For "normal", include images of healthy hands, arms, faces, torsos

# STEP 3 (OPTIONAL — use Gemini to expand dataset):
# If you have extra unlabeled medical images, run this script to auto-label them:
#
# pip install google-generativeai Pillow
#
# Then run the gemini_labeler.py script (included below)


# ======================================================
# PART 3: TRAINING SCRIPT (COPY-PASTE INTO COLAB OR RUN ON RTX 3050)
# ======================================================

# REQUIREMENTS:
# - Python 3.10+
# - NVIDIA GPU (RTX 3050 with 4GB VRAM minimum, or use Google Colab free T4)
# - ~3 hours total time

# STEP 1: Install dependencies
# pip install torch torchvision timm Pillow scikit-learn tqdm onnx

import os
import sys
import copy
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, WeightedRandomSampler
from torchvision import transforms, datasets
from tqdm import tqdm
import timm
import numpy as np


# ===== CONFIGURATION — CHANGE THESE =====
DATASET_DIR = "./lyfelens_dataset"   # Path to your organized dataset
BATCH_SIZE = 8                        # Use 8 for RTX 3050 (4GB), 16 for Colab T4
NUM_WORKERS = 2                       # Set to 0 if you get multiprocessing errors on Windows
IMAGE_SIZE = 380                      # EfficientNet-B4 optimal input
PHASE1_EPOCHS = 10                    # Head-only training
PHASE2_EPOCHS = 15                    # Fine-tuning
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
# =========================================


def main():
    print("=" * 60)
    print("  LyfeLens EfficientNet-B4 Medical Classifier Training")
    print("=" * 60)
    print(f"Device: {DEVICE}")
    if DEVICE == "cuda":
        print(f"GPU: {torch.cuda.get_device_name(0)}")
        vram = torch.cuda.get_device_properties(0).total_mem / 1e9
        print(f"VRAM: {vram:.1f} GB")
        if vram < 3.5:
            print("⚠️  Low VRAM! Reducing batch size to 4")
            global BATCH_SIZE
            BATCH_SIZE = 4

    # ===== DATA AUGMENTATION =====
    # Heavy augmentation is CRITICAL for small medical datasets
    train_transform = transforms.Compose([
        transforms.RandomResizedCrop(IMAGE_SIZE, scale=(0.65, 1.0)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomVerticalFlip(p=0.2),
        transforms.RandomRotation(25),
        transforms.ColorJitter(brightness=0.4, contrast=0.4, saturation=0.3, hue=0.08),
        transforms.RandomAffine(degrees=0, translate=(0.1, 0.1), shear=8),
        transforms.RandomPerspective(distortion_scale=0.15, p=0.25),
        transforms.RandomGrayscale(p=0.05),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        transforms.RandomErasing(p=0.15, scale=(0.02, 0.15)),
    ])

    val_transform = transforms.Compose([
        transforms.Resize(IMAGE_SIZE + 32),
        transforms.CenterCrop(IMAGE_SIZE),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])

    # ===== LOAD DATASET =====
    print("\n📂 Loading dataset...")
    train_dataset = datasets.ImageFolder(os.path.join(DATASET_DIR, "train"), transform=train_transform)
    val_dataset = datasets.ImageFolder(os.path.join(DATASET_DIR, "val"), transform=val_transform)

    CLASS_NAMES = train_dataset.classes
    NUM_CLASSES = len(CLASS_NAMES)
    print(f"Classes found: {CLASS_NAMES}")
    print(f"Training images: {len(train_dataset)}")
    print(f"Validation images: {len(val_dataset)}")

    # Print per-class counts
    for i, cls_name in enumerate(CLASS_NAMES):
        count = sum(1 for _, label in train_dataset.samples if label == i)
        print(f"  {cls_name}: {count} images")

    # ===== HANDLE CLASS IMBALANCE =====
    # If one class has way more images, the model gets biased.
    # WeightedRandomSampler fixes this by oversampling minority classes.
    class_counts = [0] * NUM_CLASSES
    for _, label in train_dataset.samples:
        class_counts[label] += 1

    class_weights = 1.0 / torch.tensor(class_counts, dtype=torch.float)
    sample_weights = [class_weights[label] for _, label in train_dataset.samples]
    sampler = WeightedRandomSampler(sample_weights, len(sample_weights), replacement=True)

    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, sampler=sampler,
                              num_workers=NUM_WORKERS, pin_memory=True)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False,
                            num_workers=NUM_WORKERS, pin_memory=True)

    # ===== BUILD MODEL =====
    print("\n🧠 Loading EfficientNet-B4 (ImageNet pretrained)...")
    model = timm.create_model(
        'efficientnet_b4',
        pretrained=True,
        num_classes=NUM_CLASSES,
        drop_rate=0.4,
        drop_path_rate=0.2,
    )

    # Freeze everything except classifier head
    for param in model.parameters():
        param.requires_grad = False
    for param in model.classifier.parameters():
        param.requires_grad = True

    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total = sum(p.numel() for p in model.parameters())
    print(f"Parameters: {trainable:,} trainable / {total:,} total ({trainable/total*100:.1f}%)")

    model = model.to(DEVICE)
    criterion = nn.CrossEntropyLoss()

    # ===== PHASE 1: TRAIN CLASSIFIER HEAD =====
    print("\n" + "=" * 60)
    print("  PHASE 1: Training classifier head only")
    print("=" * 60)

    optimizer = torch.optim.AdamW(model.classifier.parameters(), lr=1e-3, weight_decay=0.01)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=PHASE1_EPOCHS)

    best_acc = 0
    for epoch in range(PHASE1_EPOCHS):
        loss, train_acc = train_one_epoch(model, train_loader, criterion, optimizer, DEVICE)
        val_acc = evaluate(model, val_loader, DEVICE)
        scheduler.step()
        print(f"Epoch {epoch+1}/{PHASE1_EPOCHS} | Loss: {loss:.4f} | Train: {train_acc:.1f}% | Val: {val_acc:.1f}%")
        if val_acc > best_acc:
            best_acc = val_acc
            torch.save(model.state_dict(), "lyfelens_best.pth")

    print(f"Phase 1 best: {best_acc:.1f}%")

    # ===== PHASE 2: FINE-TUNE TOP LAYERS =====
    print("\n" + "=" * 60)
    print("  PHASE 2: Fine-tuning top 30% of network")
    print("=" * 60)

    # Unfreeze top 30% of layers
    all_params = list(model.parameters())
    unfreeze_idx = int(len(all_params) * 0.7)
    for i, param in enumerate(all_params):
        if i >= unfreeze_idx:
            param.requires_grad = True

    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"Now training {trainable:,} parameters")

    optimizer = torch.optim.AdamW(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=1e-5,
        weight_decay=0.01
    )
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=PHASE2_EPOCHS)

    # Load best weights from phase 1
    model.load_state_dict(torch.load("lyfelens_best.pth"))

    for epoch in range(PHASE2_EPOCHS):
        loss, train_acc = train_one_epoch(model, train_loader, criterion, optimizer, DEVICE)
        val_acc = evaluate(model, val_loader, DEVICE)
        scheduler.step()
        print(f"Epoch {epoch+1}/{PHASE2_EPOCHS} | Loss: {loss:.4f} | Train: {train_acc:.1f}% | Val: {val_acc:.1f}%")
        if val_acc > best_acc:
            best_acc = val_acc
            torch.save(model.state_dict(), "lyfelens_best.pth")
            print(f"  ✅ NEW BEST: {val_acc:.1f}%")

    print(f"\n🏆 FINAL BEST ACCURACY: {best_acc:.1f}%")

    # ===== EXPORT TO ONNX =====
    print("\n📦 Exporting to ONNX...")
    model.load_state_dict(torch.load("lyfelens_best.pth"))
    model.eval()
    model = model.to("cpu")  # Export from CPU for compatibility

    dummy = torch.randn(1, 3, IMAGE_SIZE, IMAGE_SIZE)
    torch.onnx.export(
        model, dummy, "lyfelens_model.onnx",
        input_names=["input"],
        output_names=["output"],
        dynamic_axes={"input": {0: "batch"}, "output": {0: "batch"}},
        opset_version=13,
    )

    # Save class names mapping
    import json
    with open("lyfelens_classes.json", "w") as f:
        json.dump({
            "classes": CLASS_NAMES,
            "image_size": IMAGE_SIZE,
            "normalize_mean": [0.485, 0.456, 0.406],
            "normalize_std": [0.229, 0.224, 0.225],
        }, f, indent=2)

    print("✅ DONE! Files created:")
    print("   1. lyfelens_model.onnx  — THE MODEL (give this back)")
    print("   2. lyfelens_classes.json — class names + preprocessing info")
    print("   3. lyfelens_best.pth    — PyTorch weights (backup)")
    print("\n🔥 Send lyfelens_model.onnx + lyfelens_classes.json back to the team!")


def train_one_epoch(model, loader, criterion, optimizer, device):
    model.train()
    total_loss, correct, total = 0, 0, 0
    for images, labels in tqdm(loader, desc="Training", leave=False):
        images, labels = images.to(device), labels.to(device)
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        optimizer.step()
        total_loss += loss.item()
        _, predicted = outputs.max(1)
        correct += predicted.eq(labels).sum().item()
        total += labels.size(0)
    return total_loss / len(loader), 100.0 * correct / total


def evaluate(model, loader, device):
    model.eval()
    correct, total = 0, 0
    with torch.no_grad():
        for images, labels in loader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            _, predicted = outputs.max(1)
            correct += predicted.eq(labels).sum().item()
            total += labels.size(0)
    return 100.0 * correct / total


if __name__ == "__main__":
    main()
