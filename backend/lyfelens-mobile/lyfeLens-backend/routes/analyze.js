const express = require('express')
const router = express.Router()
const NodeCache = require('node-cache')
const { analyzeScene } = require('../services/gemini')
const { saveSession } = require('../services/firebase')
const { getAnchor } = require('../utils/getAnchor')
const scenarios = require('../data/scenarios')

// Our own trained model (ONNX) — loaded lazily
const { classifyImage, isModelAvailable } = require('../ml/onnxClassifier')

// MoveNet pipeline — for pose-based detection
let processFrame = null
let moveNetReady = false

const initML = async () => {
    try {
        const ml = require('../ml/pipeline')
        processFrame = ml.processFrame
        await ml.initMoveNet()
        moveNetReady = true
        console.log('[ML] MoveNet pipeline loaded successfully')
    } catch (err) {
        console.log('[ML] MoveNet not available:', err.message)
        moveNetReady = false
    }
}

initML()


const cache = new NodeCache()

// Pre-warm all scenarios on startup
Object.entries(scenarios).forEach(([key, val]) => {
    cache.set(key, { ...val, condition_code: key, confidence: 95, source: 'prewarm' })
})
console.log('Cache pre-warmed with scenarios')

// Check if our own ONNX classifier is available
if (isModelAvailable()) {
    console.log('[ML] Custom ONNX classifier found ✅ (lyfelens_model.onnx)')
} else {
    console.log('[ML] Custom ONNX classifier NOT found — will skip Stage 1')
    console.log('     Train the model and drop lyfelens_model.onnx + lyfelens_classes.json in ml/')
}

router.post('/', async (req, res) => {
    const { sessionId, imageBase64, audioContext, lat, lng, activeCondition } = req.body

    try {
        // ─── STAGE 1: MoveNet (Pose Detection & 3D anchor alignment — Always runs!) ───
        let keypoints = []
        let moveNetScene = null
        let hasPerson = false

        if (moveNetReady && processFrame && imageBase64) {
            const mlResult = await processFrame(imageBase64)
            keypoints = mlResult.keypoints
            moveNetScene = mlResult.scene
            hasPerson = mlResult.hasPerson

            // If we are just tracking an active emergency, return immediately to save 3-4s latency!
            if (activeCondition && activeCondition !== 'NONE') {
                return res.json({
                    condition_code: activeCondition,
                    confidence: 99,
                    keypoints: keypoints,
                    hasPerson: hasPerson,
                    rescuerArmsBent: mlResult.rescuerArmsBent || false,
                    source: 'tracking_cache',
                    overlay_anchor: getAnchor(keypoints, activeCondition)
                });
            }

            if (moveNetScene) {
                console.log(`[Stage 1 - MoveNet] Pose: ${moveNetScene}`)
            }
        }

        // ─── STAGE 2: Our Custom ONNX Classifier (visual injury) ───
        let conditionCode = null
        let confidence = 0
        let bodyPart = 'chest'
        let source = 'none'

        // 2a. MoveNet pose classification (CPR, Choking, Seizure) — FAST PATH, no AI needed!
        if (moveNetScene && cache.has(moveNetScene)) {
            conditionCode = moveNetScene
            confidence = 85
            source = 'movenet'
            bodyPart = scenarios[moveNetScene]?.body_part || 'chest'
            console.log(`[Stage 1] MoveNet → ${conditionCode} (fast path, skipping AI)`)

            // Return immediately with keypoints — no need to call AI at all
            const scenarioData = scenarios[conditionCode] || scenarios['CARDIAC_ARREST']
            const overlayAnchor = getAnchor(keypoints, bodyPart)
            return res.json({
                condition_code: conditionCode,
                confidence,
                keypoints,
                hasPerson,
                rescuerArmsBent: mlResult.rescuerArmsBent || false,
                source,
                scenario_text: scenarioData?.scenario_text || '',
                overlay_anchor: overlayAnchor
            })
        }

        // 2b. Our own trained EfficientNet classifier
        if (!conditionCode && imageBase64 && isModelAvailable()) {
            try {
                const onnxResult = await classifyImage(imageBase64)
                if (onnxResult.condition_code && onnxResult.condition_code !== 'NONE' && onnxResult.confidence > 0.6) {
                    conditionCode = onnxResult.condition_code
                    confidence = Math.round(onnxResult.confidence * 100)
                    source = 'lyfelens-vit'
                    console.log(`[Stage 2] Own model → ${conditionCode} (${confidence}%)`)
                    console.log(`          All probs:`, onnxResult.all_probs)
                }
            } catch (err) {
                console.log(`[Stage 2] ONNX error: ${err.message}`)
            }
        }


        // ─── FALLBACK: Gemini (only if nothing else worked) ───
        if (!conditionCode && imageBase64) {
            console.log(`[Fallback] Using Gemini...`)
            const geminiResult = await analyzeScene(imageBase64, audioContext || '', moveNetScene)

            if (geminiResult.condition_code && geminiResult.condition_code !== 'NONE') {
                conditionCode = geminiResult.condition_code
                confidence = geminiResult.confidence || 90
                bodyPart = geminiResult.body_part_detected || 'chest'
                source = 'gemini'
                console.log(`[Fallback] Gemini → ${conditionCode}`)
            }
        }

        // ─── No emergency detected ───
        if (!conditionCode) {
            return res.json({
                condition_code: 'NONE',
                confidence: 99,
                keypoints: keypoints,
                hasPerson: hasPerson,
                source: 'clear'
            })
        }

        // ─── Build response ───
        const scenarioData = scenarios[conditionCode] || scenarios['CARDIAC_ARREST']
        const overlayAnchor = getAnchor(keypoints, bodyPart)

        const response = {
            ...scenarioData,
            condition_code: conditionCode,
            confidence: confidence,
            keypoints: keypoints,
            overlay_anchor: overlayAnchor,
            hasPerson: hasPerson,
            source: source,
        }

        // Save to Firebase async
        saveSession(sessionId, { ...response, lat: lat || 0, lng: lng || 0 })

        console.log(`[Response] ${conditionCode} (${confidence}%) via ${source}`)

        return res.json(response)

    } catch (err) {
        console.error('[Route] Analyze error:', err.message)
        return res.json({
            condition_code: 'NONE',
            confidence: 0,
            keypoints: [],
            source: 'error'
        })
    }
})

module.exports = router