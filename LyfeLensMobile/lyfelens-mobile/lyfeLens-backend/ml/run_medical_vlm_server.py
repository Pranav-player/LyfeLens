# LyfeLens Medical VLM Server — Qwen2.5-VL-3B
# ==============================================
# REPLACES Groq/Gemini — runs 100% locally on RTX 3050 (4GB VRAM)
# NO API KEY NEEDED.
#
# SETUP (on friend's PC):
#   pip install transformers torch pillow flask accelerate bitsandbytes qwen-vl-utils
#
# RUN:
#   python run_medical_vlm_server.py
#
# First run downloads ~6GB. After that, offline forever.

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
    print("Run: pip install transformers torch pillow flask accelerate bitsandbytes qwen-vl-utils")
    sys.exit(1)

MODEL_ID = "Qwen/Qwen2.5-VL-3B-Instruct"
PORT = 5050
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

SYSTEM_PROMPT = """You are an expert emergency first-aid AI in an AR headset called LyfeLens.
A bystander with ZERO medical training is pointing their phone at someone who needs help.

Your job:
1. Look at the image carefully
2. Identify EXACTLY what you see (wound type, body location, severity)
3. Give calm, clear STEP-BY-STEP instructions a panicked person can follow
4. Be SPECIFIC — "press HERE on the forearm" not "apply pressure"
5. Tell what NOT to do
6. Say if they should call emergency services

Respond ONLY in this JSON:
{
  "condition": "BLEEDING or BURNS or CARDIAC_ARREST or CHOKING or SEIZURE or STROKE or NONE",
  "severity": "mild or moderate or severe",
  "body_part": "where on body",
  "summary": "One sentence: what you see",
  "steps": ["Step 1: ...", "Step 2: ...", "Step 3: ...", "Step 4: ...", "Step 5: ..."],
  "do_not": ["Do NOT ...", "Do NOT ..."],
  "call_emergency": true
}"""

USER_PROMPT = "Look at this emergency. What do you see and what should the bystander do RIGHT NOW? Be specific."

app = Flask(__name__)
model = None
processor = None


def load_model():
    global model, processor
    if model is not None:
        return

    print(f"Loading Qwen2.5-VL-3B on {DEVICE}...")
    print("First time downloads ~6GB — be patient")

    if DEVICE == "cuda":
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
        model = Qwen2_5_VLForConditionalGeneration.from_pretrained(
            MODEL_ID,
            torch_dtype=torch.float32,
            device_map="cpu",
        )

    processor = AutoProcessor.from_pretrained(MODEL_ID)
    print(f"✅ Qwen2.5-VL-3B loaded on {DEVICE}")
    if DEVICE == "cuda":
        vram = torch.cuda.memory_allocated() / 1e9
        print(f"   VRAM used: {vram:.1f}GB")


@app.route('/analyze', methods=['POST'])
def analyze_image():
    load_model()
    data = request.get_json()
    if not data or 'imageBase64' not in data:
        return jsonify({"error": "Missing imageBase64"}), 400

    try:
        img_bytes = base64.b64decode(data['imageBase64'])
        image = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        if max(image.size) > 512:
            image.thumbnail((512, 512))

        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": [
                {"type": "image", "image": image},
                {"type": "text", "text": USER_PROMPT},
            ]},
        ]

        text = processor.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        inputs = processor(text=[text], images=[image], padding=True, return_tensors="pt").to(model.device)

        start = time.time()
        with torch.no_grad():
            output_ids = model.generate(**inputs, max_new_tokens=500, temperature=0.3, do_sample=True, top_p=0.9)

        generated = output_ids[0][inputs.input_ids.shape[1]:]
        answer = processor.decode(generated, skip_special_tokens=True).strip()
        ms = int((time.time() - start) * 1000)

        print(f"[Qwen] {ms}ms | {answer[:150]}...")

        result = parse_json(answer)
        result["source"] = "qwen2.5-vl-3b-local"
        result["inference_ms"] = ms

        # Map condition
        cmap = {
            "bleeding": "BLEEDING", "bleed": "BLEEDING", "cut": "BLEEDING", "wound": "BLEEDING",
            "burn": "BURNS", "burns": "BURNS",
            "cardiac": "CARDIAC_ARREST", "cpr": "CARDIAC_ARREST",
            "choking": "CHOKING", "choke": "CHOKING",
            "seizure": "SEIZURE", "convulsion": "SEIZURE",
            "stroke": "STROKE", "droop": "STROKE",
            "none": "NONE", "normal": "NONE",
        }
        raw = result.get("condition", "").lower()
        result["condition_code"] = "NONE"
        for k, v in cmap.items():
            if k in raw:
                result["condition_code"] = v
                break

        return jsonify(result)

    except Exception as e:
        print(f"[Qwen] Error: {e}")
        return jsonify({"error": str(e), "source": "qwen-error"}), 500


def parse_json(text):
    m = re.search(r'\{.*\}', text, re.DOTALL)
    if m:
        try:
            return json.loads(m.group())
        except json.JSONDecodeError:
            pass
    return {
        "condition": "UNKNOWN", "severity": "unknown", "body_part": "unknown",
        "summary": text[:150],
        "steps": [l.strip() for l in text.split('\n') if l.strip()],
        "do_not": [], "call_emergency": True,
    }


@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "model": MODEL_ID, "device": DEVICE, "loaded": model is not None})


if __name__ == '__main__':
    print("=" * 50)
    print("  LyfeLens Medical VLM (Qwen2.5-VL-3B)")
    print("=" * 50)
    print(f"Device: {DEVICE}")
    if DEVICE == "cuda":
        print(f"GPU: {torch.cuda.get_device_name(0)}")
    print(f"Server: http://0.0.0.0:{PORT}")
    load_model()
    app.run(host='0.0.0.0', port=PORT, debug=False)
