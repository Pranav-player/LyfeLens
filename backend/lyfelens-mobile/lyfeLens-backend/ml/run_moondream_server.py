# LyfeLens Medical VLM Server — Qwen2.5-VL-3B
# ==============================================
# REPLACES Groq/Gemini — runs 100% locally on RTX 3050
# NO API KEY NEEDED.
#
# Qwen2.5-VL-3B is Alibaba's latest vision-language model.
# It's the BEST small VLM that fits in 4GB VRAM.
# Much better than Moondream2 for generating detailed instructions.
#
# SETUP (run on your friend's RTX 3050 PC):
#   pip install transformers torch pillow flask accelerate bitsandbytes qwen-vl-utils
#
# RUN:
#   python run_medical_vlm_server.py
#
# First run downloads ~6GB model files (one time only).
# After that, runs offline.

import io
import base64
import json
import sys
import time
import re

try:
    from flask import Flask, request, jsonify
    from PIL import Image
    import torch
    from transformers import Qwen2_5_VLForConditionalGeneration, AutoProcessor, BitsAndBytesConfig
except ImportError as e:
    print(f"Missing: {e}")
    print("Install all dependencies:")
    print("  pip install transformers torch pillow flask accelerate bitsandbytes qwen-vl-utils")
    sys.exit(1)


# ===== CONFIG =====
MODEL_ID = "Qwen/Qwen2.5-VL-3B-Instruct"
PORT = 5050
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
# ==================

# Medical system prompt — this is what makes it give SPECIFIC, GOOD instructions
SYSTEM_PROMPT = """You are an expert emergency first-aid AI embedded in an AR headset called LyfeLens.
A bystander with ZERO medical training is pointing their phone at someone who needs help.
You can SEE the injury through the camera.

Your job:
1. Look at the image carefully
2. Identify EXACTLY what you see (type of wound, location on body, severity)
3. Give calm, clear, STEP-BY-STEP instructions that a panicked non-medical person can follow
4. Be SPECIFIC about what you see — "press HERE on the forearm" not just "apply pressure"
5. Tell them what NOT to do (common dangerous mistakes)
6. State if they should call emergency services

Respond ONLY in this JSON format, no other text:
{
  "condition": "BLEEDING or BURNS or CARDIAC_ARREST or CHOKING or SEIZURE or STROKE or NONE",
  "severity": "mild or moderate or severe",
  "body_part": "where on the body you see the issue",
  "summary": "One clear sentence: what you see",
  "steps": [
    "Step 1: ...",
    "Step 2: ...",
    "Step 3: ...",
    "Step 4: ...",
    "Step 5: ..."
  ],
  "do_not": [
    "Do NOT ...",
    "Do NOT ..."
  ],
  "call_emergency": true or false
}"""

USER_PROMPT = "Look at this image of an emergency situation. What do you see and what should the bystander do RIGHT NOW? Be specific based on what you see in the image."


app = Flask(__name__)
model = None
processor = None


def load_model():
    global model, processor
    if model is not None:
        return

    print(f"Loading Qwen2.5-VL-3B on {DEVICE}...")
    print("(First time downloads ~6GB — be patient)")

    if DEVICE == "cuda":
        # 4-bit quantization — fits in 4GB VRAM
        quant_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_use_double_quant=True,
        )
        model = Qwen2_5_VLForConditionalGeneration.from_pretrained(
            MODEL_ID,
            quantization_config=quant_config,
            device_map="auto",
            torch_dtype=torch.float16,
        )
    else:
        # CPU mode — slower but works
        model = Qwen2_5_VLForConditionalGeneration.from_pretrained(
            MODEL_ID,
            torch_dtype=torch.float32,
            device_map="cpu",
        )

    processor = AutoProcessor.from_pretrained(MODEL_ID)

    print(f"✅ Qwen2.5-VL-3B loaded on {DEVICE}")
    if DEVICE == "cuda":
        vram_used = torch.cuda.memory_allocated() / 1e9
        vram_total = torch.cuda.get_device_properties(0).total_mem / 1e9
        print(f"   VRAM: {vram_used:.1f}GB / {vram_total:.1f}GB")


@app.route('/analyze', methods=['POST'])
def analyze_image():
    """
    Expects JSON: { "imageBase64": "..." }
    Returns: medical instruction JSON
    """
    load_model()

    data = request.get_json()
    if not data or 'imageBase64' not in data:
        return jsonify({"error": "Missing imageBase64"}), 400

    try:
        # Decode base64 image
        img_bytes = base64.b64decode(data['imageBase64'])
        image = Image.open(io.BytesIO(img_bytes)).convert("RGB")

        # Resize to save VRAM
        max_size = 512
        if max(image.size) > max_size:
            image.thumbnail((max_size, max_size))

        # Build the chat message
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": [
                {"type": "image", "image": image},
                {"type": "text", "text": USER_PROMPT},
            ]},
        ]

        # Process input
        text = processor.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        inputs = processor(
            text=[text],
            images=[image],
            padding=True,
            return_tensors="pt"
        ).to(model.device)

        # Generate response
        start_time = time.time()
        with torch.no_grad():
            output_ids = model.generate(
                **inputs,
                max_new_tokens=500,
                temperature=0.3,      # Low temp = more precise medical text
                do_sample=True,
                top_p=0.9,
            )

        # Decode
        generated_ids = output_ids[0][inputs.input_ids.shape[1]:]
        answer = processor.decode(generated_ids, skip_special_tokens=True).strip()
        inference_time = time.time() - start_time

        print(f"[Qwen2.5-VL] Inference: {inference_time:.1f}s")
        print(f"[Qwen2.5-VL] Raw output: {answer[:200]}...")

        # Parse JSON from response
        result = parse_medical_json(answer)
        result["source"] = "qwen2.5-vl-3b-local"
        result["inference_ms"] = int(inference_time * 1000)

        # Map to our condition codes
        condition_map = {
            "bleeding": "BLEEDING", "bleed": "BLEEDING", "cut": "BLEEDING", "wound": "BLEEDING",
            "burn": "BURNS", "burns": "BURNS", "scald": "BURNS",
            "cardiac": "CARDIAC_ARREST", "cpr": "CARDIAC_ARREST", "heart": "CARDIAC_ARREST",
            "choking": "CHOKING", "choke": "CHOKING", "airway": "CHOKING",
            "seizure": "SEIZURE", "convulsion": "SEIZURE", "epilep": "SEIZURE",
            "stroke": "STROKE", "droop": "STROKE", "facial": "STROKE",
            "none": "NONE", "normal": "NONE", "healthy": "NONE",
        }
        raw = result.get("condition", "").lower()
        result["condition_code"] = "NONE"
        for key, code in condition_map.items():
            if key in raw:
                result["condition_code"] = code
                break

        return jsonify(result)

    except Exception as e:
        print(f"[Qwen2.5-VL] Error: {e}")
        return jsonify({"error": str(e), "source": "qwen-error"}), 500


def parse_medical_json(text):
    """Try to extract JSON from model output, with fallback."""
    # Try to find JSON in the text
    json_match = re.search(r'\{.*\}', text, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group())
        except json.JSONDecodeError:
            pass

    # Fallback: wrap raw text as instructions
    return {
        "condition": "UNKNOWN",
        "severity": "unknown",
        "body_part": "unknown",
        "summary": text[:150],
        "steps": [line.strip() for line in text.split('\n') if line.strip()],
        "do_not": [],
        "call_emergency": True,
    }


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "ok",
        "model": MODEL_ID,
        "device": DEVICE,
        "loaded": model is not None,
        "quantization": "4-bit NF4" if DEVICE == "cuda" else "fp32",
    })


if __name__ == '__main__':
    print("=" * 55)
    print("  LyfeLens Medical VLM Server (Qwen2.5-VL-3B)")
    print("=" * 55)
    print(f"Device: {DEVICE}")
    if DEVICE == "cuda":
        print(f"GPU: {torch.cuda.get_device_name(0)}")
        print(f"VRAM: {torch.cuda.get_device_properties(0).total_mem / 1e9:.1f} GB")
    print(f"\nServer: http://0.0.0.0:{PORT}")
    print(f"Endpoint: POST /analyze  (send imageBase64)")
    print(f"Health:   GET  /health")
    print()

    # Pre-load model at startup
    load_model()

    app.run(host='0.0.0.0', port=PORT, debug=False)
