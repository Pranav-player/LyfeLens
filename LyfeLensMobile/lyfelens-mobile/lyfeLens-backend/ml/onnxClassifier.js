// LyfeLens ONNX Model Inference for Node.js Backend
// ==================================================
// This file loads the trained ONNX model and classifies images.
// 
// SETUP:
//   npm install onnxruntime-node sharp
//
// AFTER YOUR TEAMMATE GIVES YOU THE FILES:
//   1. Put lyfelens_model.onnx in this folder (ml/)
//   2. Put lyfelens_classes.json in this folder (ml/)
//   3. Restart the backend server
//   4. It just works.

const ort = require('onnxruntime-node');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const MODEL_PATH = path.join(__dirname, 'lyfelens_model.onnx');
const CLASSES_PATH = path.join(__dirname, 'lyfelens_classes.json');

let session = null;
let config = null;

// Map model output labels to the condition codes used by the AR overlays
const LABEL_TO_CONDITION = {
  'bleeding': 'BLEEDING',
  'burns': 'BURNS',
  'stroke_face': 'STROKE',
  'normal': 'NONE',
  // Add more mappings if you train with more classes
};

async function loadModel() {
  if (session) return session;

  // Check if model file exists
  if (!fs.existsSync(MODEL_PATH)) {
    console.log('⚠️  ONNX model not found at:', MODEL_PATH);
    console.log('   The model has not been trained yet.');
    console.log('   Using Groq/Gemini fallback for now.');
    return null;
  }

  // Load class config
  if (fs.existsSync(CLASSES_PATH)) {
    config = JSON.parse(fs.readFileSync(CLASSES_PATH, 'utf-8'));
    console.log('📋 Model classes:', config.classes);
  } else {
    config = {
      classes: ['bleeding', 'burns', 'normal', 'stroke_face'],
      image_size: 380,
      normalize_mean: [0.485, 0.456, 0.406],
      normalize_std: [0.229, 0.224, 0.225],
    };
  }

  try {
    session = await ort.InferenceSession.create(MODEL_PATH, {
      executionProviders: ['cpu'], // Use 'cuda' if NVIDIA GPU available on server
    });
    console.log('✅ LyfeLens ONNX model loaded successfully');
    console.log('   Classes:', config.classes);
    return session;
  } catch (err) {
    console.error('❌ Failed to load ONNX model:', err.message);
    return null;
  }
}

/**
 * Classify a base64 image using our trained EfficientNet model.
 * Returns: { label, condition_code, confidence, all_probs }
 */
async function classifyImage(base64Image) {
  const sess = await loadModel();
  if (!sess) {
    return { label: null, condition_code: null, confidence: 0, source: 'model-not-loaded' };
  }

  const imageSize = config.image_size || 380;
  const mean = config.normalize_mean || [0.485, 0.456, 0.406];
  const std = config.normalize_std || [0.229, 0.224, 0.225];

  try {
    // Decode base64 → resize → raw pixel buffer
    const imgBuffer = Buffer.from(base64Image, 'base64');
    const { data } = await sharp(imgBuffer)
      .resize(imageSize, imageSize, { fit: 'cover' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Convert to normalized float32 tensor in CHW format (channels first)
    // EfficientNet expects [batch, channels, height, width]
    const pixelCount = imageSize * imageSize;
    const float32Data = new Float32Array(3 * pixelCount);

    for (let i = 0; i < pixelCount; i++) {
      const r = data[i * 3] / 255.0;
      const g = data[i * 3 + 1] / 255.0;
      const b = data[i * 3 + 2] / 255.0;

      float32Data[i] = (r - mean[0]) / std[0];                     // Red channel
      float32Data[i + pixelCount] = (g - mean[1]) / std[1];        // Green channel
      float32Data[i + 2 * pixelCount] = (b - mean[2]) / std[2];    // Blue channel
    }

    // Run inference
    const inputTensor = new ort.Tensor('float32', float32Data, [1, 3, imageSize, imageSize]);
    const results = await sess.run({ input: inputTensor });

    // Get output logits
    const logits = Array.from(results.output.data);
    const probs = softmax(logits);
    const maxIdx = probs.indexOf(Math.max(...probs));
    const label = config.classes[maxIdx];
    const confidence = probs[maxIdx];

    // Build all probabilities for debugging
    const allProbs = {};
    config.classes.forEach((cls, i) => {
      allProbs[cls] = Math.round(probs[i] * 1000) / 10; // e.g., 94.2%
    });

    return {
      label: label,
      condition_code: LABEL_TO_CONDITION[label] || 'NONE',
      confidence: confidence,
      all_probs: allProbs,
      source: 'lyfelens-vit',
    };
  } catch (err) {
    console.error('❌ Classification error:', err.message);
    return { label: null, condition_code: null, confidence: 0, source: 'model-error' };
  }
}

function softmax(arr) {
  const max = Math.max(...arr);
  const exps = arr.map(x => Math.exp(x - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(x => x / sum);
}

/**
 * Check if the trained model is available
 */
function isModelAvailable() {
  return fs.existsSync(MODEL_PATH);
}

module.exports = { classifyImage, loadModel, isModelAvailable };
