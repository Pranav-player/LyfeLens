# Gemini Auto-Labeler for LyfeLens Dataset
# ==========================================
# Use this script to expand your dataset.
# It sends unlabeled images to Gemini → Gemini classifies them →
# images get sorted into the right folders automatically.
#
# USAGE:
#   1. pip install google-generativeai Pillow
#   2. Put all unlabeled images into a folder called "unlabeled/"
#   3. Set your GEMINI_API_KEY below
#   4. Run: python gemini_labeler.py
#   5. Labeled images appear in lyfelens_dataset/train/<class>/

import os
import shutil
import time

try:
    import google.generativeai as genai
    from PIL import Image
except ImportError:
    print("Install dependencies first:")
    print("  pip install google-generativeai Pillow")
    exit(1)


# ===== CONFIGURATION =====
GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE"  # Replace with your key
INPUT_DIR = "./unlabeled"                     # Folder with unlabeled images
OUTPUT_DIR = "./lyfelens_dataset/train"       # Output into training set
# ==========================

CLASSES = ["bleeding", "burns", "normal", "stroke_face"]

PROMPT = """You are a strict medical image classifier for an emergency first-aid app.

Look at this image and classify it into EXACTLY ONE of these categories:
- bleeding: any visible cut, wound, laceration, active bleeding, open injury
- burns: any thermal burn, chemical burn, sunburn, scalding on skin
- stroke_face: facial drooping, asymmetric face, Bell's palsy, one-sided weakness
- normal: healthy skin, no visible injury, normal person

Rules:
- If the image is unclear or doesn't fit any category, say "normal"
- Respond with ONLY the category name (one word), nothing else
- No explanations, no sentences, just the label"""


def main():
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-2.0-flash')

    # Create output directories
    for cls in CLASSES:
        os.makedirs(os.path.join(OUTPUT_DIR, cls), exist_ok=True)

    if not os.path.exists(INPUT_DIR):
        print(f"❌ Input directory '{INPUT_DIR}' not found!")
        print(f"   Create it and put your unlabeled images inside.")
        return

    image_files = [f for f in os.listdir(INPUT_DIR)
                   if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp', '.bmp'))]

    print(f"Found {len(image_files)} images to label")
    print(f"Output: {OUTPUT_DIR}")
    print("-" * 40)

    stats = {cls: 0 for cls in CLASSES}
    errors = 0

    for i, filename in enumerate(image_files):
        filepath = os.path.join(INPUT_DIR, filename)
        try:
            img = Image.open(filepath).convert("RGB")

            # Resize large images to save API costs
            if max(img.size) > 1024:
                img.thumbnail((1024, 1024))

            response = model.generate_content([PROMPT, img])
            label = response.text.strip().lower().replace(".", "").replace(",", "")

            if label in CLASSES:
                dest = os.path.join(OUTPUT_DIR, label, filename)
                shutil.copy2(filepath, dest)
                stats[label] += 1
                print(f"  [{i+1}/{len(image_files)}] ✅ {filename} → {label}")
            else:
                # Unknown label — put in normal
                dest = os.path.join(OUTPUT_DIR, "normal", filename)
                shutil.copy2(filepath, dest)
                stats["normal"] += 1
                print(f"  [{i+1}/{len(image_files)}] ⚠️  {filename} → '{label}' (defaulted to normal)")

            # Rate limit: Gemini free tier = 15 RPM
            time.sleep(4.5)

        except Exception as e:
            errors += 1
            print(f"  [{i+1}/{len(image_files)}] ❌ {filename} → Error: {e}")
            time.sleep(2)

    print("\n" + "=" * 40)
    print("LABELING COMPLETE")
    print("=" * 40)
    for cls, count in stats.items():
        print(f"  {cls}: {count} images")
    print(f"  errors: {errors}")
    print(f"\n👉 Now review a few images in each folder to verify Gemini's labels!")
    print(f"   Remove any that are clearly wrong before training.")


if __name__ == "__main__":
    main()
