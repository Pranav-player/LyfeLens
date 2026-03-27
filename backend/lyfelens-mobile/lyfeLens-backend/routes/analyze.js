const express = require('express')
const router = express.Router()
const NodeCache = require('node-cache')
const { analyzeScene } = require('../services/gemini')
const { saveSession } = require('../services/firebase')
const { getAnchor } = require('../utils/getAnchor')
const scenarios = require('../data/scenarios')

// MoveNet pipeline — loaded lazily to avoid crash if TF not installed
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
        console.log('[ML] MoveNet not available, running Gemini-only mode:', err.message)
        moveNetReady = false
    }
}

// Initialize MoveNet in background (don't block server startup)
initML()

const cache = new NodeCache()

// Pre-warm all 8 scenarios on startup
Object.entries(scenarios).forEach(([key, val]) => {
    cache.set(key, { ...val, condition_code: key, confidence: 95, source: 'prewarm' })
})
console.log('Cache pre-warmed with 8 scenarios')

router.post('/', async (req, res) => {
    const { sessionId, imageBase64, audioContext, lat, lng } = req.body

    try {
        // ─── STEP 1: Run MoveNet for keypoints + pose classification ───
        let keypoints = []
        let moveNetScene = null
        let hasPerson = false

        if (moveNetReady && processFrame && imageBase64) {
            const mlResult = await processFrame(imageBase64)
            keypoints = mlResult.keypoints
            moveNetScene = mlResult.scene
            hasPerson = mlResult.hasPerson

            if (moveNetScene) {
                console.log(`[MoveNet] Pose classified: ${moveNetScene}`)
            }
            if (hasPerson) {
                console.log(`[MoveNet] Person detected with ${keypoints.length} keypoints`)
            }
        }

        // ─── STEP 2: Determine condition code ───
        let conditionCode = null
        let confidence = 0
        let bodyPart = 'chest'
        let source = 'none'

        // 2a. If MoveNet classified a pose (CHOKING, SEIZURE, CARDIAC_ARREST)
        //     use it as primary — it's instant and works offline
        if (moveNetScene && cache.has(moveNetScene)) {
            conditionCode = moveNetScene
            confidence = 85
            source = 'movenet'
            bodyPart = scenarios[moveNetScene]?.body_part || 'chest'
            console.log(`[Route] Using MoveNet classification: ${conditionCode}`)
        }

        // 2b. If MoveNet couldn't classify (visual injuries like BLEEDING, BURNS)
        //     OR if we want Gemini to confirm/refine, call Gemini
        if (!conditionCode && imageBase64) {
            const geminiResult = await analyzeScene(imageBase64, audioContext || '', moveNetScene)

            if (geminiResult.condition_code && geminiResult.condition_code !== 'NONE') {
                conditionCode = geminiResult.condition_code
                confidence = geminiResult.confidence || 90
                bodyPart = geminiResult.body_part_detected || 'chest'
                source = 'gemini'
                console.log(`[Route] Using Gemini classification: ${conditionCode}`)
            }
        }

        // 2c. No emergency detected by either system
        if (!conditionCode) {
            return res.json({
                condition_code: 'NONE',
                confidence: 99,
                keypoints: keypoints,
                hasPerson: hasPerson,
                source: 'clear'
            })
        }

        // ─── STEP 3: Build the full response ───
        const scenarioData = scenarios[conditionCode] || scenarios['CARDIAC_ARREST']
        const overlayAnchor = getAnchor(keypoints, bodyPart)

        const response = {
            ...scenarioData,
            condition_code: conditionCode,
            confidence: confidence,
            keypoints: keypoints,        // Real MoveNet body coordinates!
            overlay_anchor: overlayAnchor, // Where to pin the detection box
            hasPerson: hasPerson,
            source: source
        }

        // Save to Firebase async (don't block response)
        saveSession(sessionId, { ...response, lat: lat || 0, lng: lng || 0 })

        console.log(`[Response] ${conditionCode} (${confidence}%) via ${source} | anchor: (${overlayAnchor.x.toFixed(2)}, ${overlayAnchor.y.toFixed(2)})`)

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