const express = require('express')
const router = express.Router()
const { analyzeScene, analyzeFromKeypoints } = require('../services/gemini')
const { saveSession } = require('../services/firebase')
const { getAnchor } = require('../utils/getAnchor')
const scenarios = require('../data/scenarios')

// ─── MoveNet Pipeline ───────────────────────────────────────────────────────
let processFrame = null
let moveNetReady = false

const initML = async () => {
    try {
        const ml = require('../ml/pipeline')
        processFrame = ml.processFrame
        await ml.initMoveNet()
        moveNetReady = true
        console.log('[ML] ✅ MoveNet ready')
    } catch (err) {
        console.log('[ML] MoveNet not available:', err.message)
        moveNetReady = false
    }
}

initML()

// ─── Helpers ────────────────────────────────────────────────────────────────
const buildResponse = (conditionCode, confidence, keypoints, hasPerson, source, extra = {}) => {
    const scenarioData = scenarios[conditionCode] || scenarios['CARDIAC_ARREST']
    const bodyPart = scenarioData?.body_part || 'chest'
    return {
        ...scenarioData,
        condition_code: conditionCode,
        confidence,
        keypoints,
        hasPerson,
        source,
        overlay_anchor: getAnchor(keypoints, bodyPart),
        ...extra
    }
}

// ─── Main Route ─────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
    const { sessionId, imageBase64, audioContext, lat, lng, activeCondition } = req.body

    try {
        // ═══════════════════════════════════════════════════════════════════
        // STEP 1: MoveNet — ALWAYS runs to get body keypoints
        // This runs on every single frame and is fast (CPU-only, ~50ms).
        // It tells us:
        //   - keypoints: body landmark coordinates for AR overlay placement
        //   - hasPerson: is a person visible in the frame?
        //   - rescuerArmsBent: is the rescuer's arm angle correct during CPR?
        // ═══════════════════════════════════════════════════════════════════
        let keypoints = []
        let hasPerson = false
        let rescuerArmsBent = false

        if (moveNetReady && processFrame && imageBase64) {
            try {
                const mlResult = await processFrame(imageBase64)
                keypoints = mlResult.keypoints || []
                hasPerson = mlResult.hasPerson || false
                rescuerArmsBent = mlResult.rescuerArmsBent || false
                if (hasPerson) {
                    console.log(`[MoveNet] Person detected — ${keypoints.length} keypoints`)
                } else {
                    console.log(`[MoveNet] No person in frame`)
                }
            } catch (moveNetErr) {
                console.log('[MoveNet] Error:', moveNetErr.message)
            }
        }

        // ═══════════════════════════════════════════════════════════════════
        // TRACKING FAST-PATH: If we're in an active emergency, skip all AI
        // and just return the current condition with fresh keypoints.
        // This keeps the AR anchors updated at full frame rate.
        // ═══════════════════════════════════════════════════════════════════
        if (activeCondition && activeCondition !== 'NONE') {
            return res.json({
                condition_code: activeCondition,
                confidence: 99,
                keypoints,
                hasPerson,
                rescuerArmsBent,
                source: 'tracking_cache',
                overlay_anchor: getAnchor(keypoints, activeCondition)
            })
        }

        // ═══════════════════════════════════════════════════════════════════
        // STEP 2A: Person detected → Send keypoints as TEXT to Groq
        //
        // Why text instead of image?
        //   - llama-3.1-8b-instant responds in ~150ms (vs 3-5s for vision)
        //   - Uses Groq CHAT quota (not vision quota — completely separate!)
        //   - No image encoding/transmission overhead
        //   - Groq reasons about pose perfectly from coordinates
        //
        // Classifies: CARDIAC_ARREST (lying flat), CHOKING (hands at throat),
        //             SEIZURE (asymmetric limbs while lying)
        // ═══════════════════════════════════════════════════════════════════
        if (hasPerson && keypoints.length > 0) {
            console.log('[Step 2A] Person found → sending keypoints to Groq (text, instant)...')
            try {
                const kpResult = await analyzeFromKeypoints(keypoints)
                if (kpResult && kpResult.condition_code && kpResult.condition_code !== 'NONE') {
                    console.log(`[Groq/KP] ✅ Detected: ${kpResult.condition_code} (${kpResult.confidence}%)`)
                    const response = buildResponse(
                        kpResult.condition_code,
                        kpResult.confidence,
                        keypoints,
                        hasPerson,
                        'groq-kp',
                        { rescuerArmsBent }
                    )
                    saveSession(sessionId, { ...response, lat: lat || 0, lng: lng || 0 })
                    return res.json(response)
                } else {
                    console.log('[Groq/KP] No emergency pose detected')
                }
            } catch (kpErr) {
                console.log('[Groq/KP] Error:', kpErr.message)
            }

            // Person is there but no emergency pose → scene is normal
            return res.json({
                condition_code: 'NONE',
                confidence: 95,
                keypoints,
                hasPerson,
                source: 'clear'
            })
        }

        // ═══════════════════════════════════════════════════════════════════
        // STEP 2B: No person detected → Send image to Groq VISION
        //
        // This handles close-up injuries where the full body isn't visible:
        //   - Burns (1st / 2nd / 3rd degree)
        //   - Bleeding (minor / severe)
        //   - Cuts (minor / major)
        //
        // MoveNet can't detect these from keypoints alone, so we use
        // Groq's vision model (Llama 4 Scout / Llama 3.2 Vision).
        // ═══════════════════════════════════════════════════════════════════
        if (!hasPerson && imageBase64) {
            console.log('[Step 2B] No person → sending image to Groq Vision (injury scan)...')
            try {
                const visionResult = await analyzeScene(imageBase64, audioContext || '', null)
                if (visionResult && visionResult.condition_code && visionResult.condition_code !== 'NONE') {
                    console.log(`[Groq/Vision] ✅ Detected: ${visionResult.condition_code} (${visionResult.confidence}%)`)
                    const response = buildResponse(
                        visionResult.condition_code,
                        visionResult.confidence,
                        keypoints,   // Still pass keypoints (may be empty for close-ups)
                        hasPerson,
                        'groq-vision'
                    )
                    saveSession(sessionId, { ...response, lat: lat || 0, lng: lng || 0 })
                    return res.json(response)
                } else {
                    console.log('[Groq/Vision] No injury detected')
                }
            } catch (visionErr) {
                console.log('[Groq/Vision] Error:', visionErr.message)
            }
        }

        // ═══════════════════════════════════════════════════════════════════
        // STEP 3: Nothing detected — scene is clear
        // Always return keypoints so the frontend can still update AR anchors.
        // ═══════════════════════════════════════════════════════════════════
        return res.json({
            condition_code: 'NONE',
            confidence: 99,
            keypoints,
            hasPerson,
            source: 'clear'
        })

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