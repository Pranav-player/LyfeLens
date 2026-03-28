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

// ─── Helper: run MoveNet on a frame ─────────────────────────────────────────
const runMoveNet = async (imageBase64) => {
    if (!moveNetReady || !processFrame || !imageBase64) {
        return { keypoints: [], hasPerson: false, rescuerArmsBent: false }
    }
    try {
        const result = await processFrame(imageBase64)
        return {
            keypoints: result.keypoints || [],
            hasPerson: result.hasPerson || false,
            rescuerArmsBent: result.rescuerArmsBent || false
        }
    } catch (e) {
        console.log('[MoveNet] Error:', e.message)
        return { keypoints: [], hasPerson: false, rescuerArmsBent: false }
    }
}

// ─── Helper: build unified response ─────────────────────────────────────────
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

// ─── Main Route ──────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
    // personHint: frontend's cached hasPerson value from the previous frame
    const { sessionId, imageBase64, audioContext, lat, lng, activeCondition, hasPerson: personHint } = req.body

    try {

        // ═══════════════════════════════════════════════════════════════════
        // TRACKING FAST-PATH
        // We're mid-emergency → just run MoveNet for fresh keypoints and echo
        // back the same condition. No AI calls needed at all.
        // This runs at ~800ms intervals to keep AR anchors smooth.
        // ═══════════════════════════════════════════════════════════════════
        if (activeCondition && activeCondition !== 'NONE') {
            const { keypoints, hasPerson, rescuerArmsBent } = await runMoveNet(imageBase64)
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
        // PATH A — hasPerson = true  (frontend confirmed a person last frame)
        //
        //  1. MoveNet → fresh keypoints + confirm hasPerson
        //  2. Groq text (llama-3.1-8b-instant, ~150ms, chat quota)
        //     → receives keypoints as structured text, not an image
        //     → classifies: CARDIAC_ARREST / CHOKING / SEIZURE
        //  3. Return result + keypoints for AR hand rendering
        // ═══════════════════════════════════════════════════════════════════
        if (personHint) {
            console.log('[Path A] Person hint=true → MoveNet then Groq text')

            // Step A1: Fresh keypoints
            const { keypoints, hasPerson, rescuerArmsBent } = await runMoveNet(imageBase64)
            console.log(`[MoveNet] ${hasPerson ? `✅ Person confirmed (${keypoints.length} kps)` : '❌ Person not found this frame'}`)

            // Step A2: Groq text classification from keypoints
            if (hasPerson && keypoints.length > 0) {
                try {
                    const kpResult = await analyzeFromKeypoints(keypoints)
                    if (kpResult && kpResult.condition_code && kpResult.condition_code !== 'NONE') {
                        console.log(`[Groq/KP] ✅ ${kpResult.condition_code} (${kpResult.confidence}%)`)
                        const response = buildResponse(
                            kpResult.condition_code, kpResult.confidence,
                            keypoints, hasPerson, 'groq-kp', { rescuerArmsBent }
                        )
                        saveSession(sessionId, { ...response, lat: lat || 0, lng: lng || 0 })
                        return res.json(response)
                    }
                    console.log('[Groq/KP] No emergency pose')
                } catch (e) {
                    console.log('[Groq/KP] Error:', e.message)
                }
                // Person present but no emergency
                return res.json({ condition_code: 'NONE', confidence: 95, keypoints, hasPerson, source: 'clear' })
            }

            // Person hint was true but MoveNet couldn't confirm — fall through to Path B
            console.log('[Path A] MoveNet did not confirm person, falling to Path B')
        }

        // ═══════════════════════════════════════════════════════════════════
        // PATH B — hasPerson = false  (no person seen last frame)
        //
        //  This means we're likely looking at a close-up injury (burn, cut,
        //  bleed) where the full body isn't in frame.
        //
        //  1. Groq VISION (Llama 4 Scout) → injury classification from image
        //     → Burns 1st/2nd/3rd, Minor/Severe Bleeding, Minor/Major Cut
        //  2. MoveNet → runs AFTER vision to get whatever body coordinates
        //     exist (for AR anchor placement even in close-up shots)
        //  3. Return injury result + keypoints
        // ═══════════════════════════════════════════════════════════════════
        console.log('[Path B] hasPerson=false → Groq Vision for injury, then MoveNet for coords')

        let injuryCode = null
        let injuryConf = 0

        if (imageBase64) {
            try {
                const visionResult = await analyzeScene(imageBase64, audioContext || '', null)
                if (visionResult && visionResult.condition_code && visionResult.condition_code !== 'NONE') {
                    injuryCode = visionResult.condition_code
                    injuryConf = visionResult.confidence || 90
                    console.log(`[Groq/Vision] ✅ ${injuryCode} (${injuryConf}%)`)
                } else {
                    console.log('[Groq/Vision] No injury detected')
                }
            } catch (e) {
                console.log('[Groq/Vision] Error:', e.message)
            }
        }

        // Step B2: MoveNet for AR coordinates (runs regardless of injury result)
        const { keypoints, hasPerson, rescuerArmsBent } = await runMoveNet(imageBase64)
        console.log(`[MoveNet] ${keypoints.length} keypoints for AR anchoring`)

        if (injuryCode) {
            const response = buildResponse(injuryCode, injuryConf, keypoints, hasPerson, 'groq-vision')
            saveSession(sessionId, { ...response, lat: lat || 0, lng: lng || 0 })
            return res.json(response)
        }

        // Nothing detected
        return res.json({ condition_code: 'NONE', confidence: 99, keypoints, hasPerson, source: 'clear' })

    } catch (err) {
        console.error('[Route] Analyze error:', err.message)
        return res.json({ condition_code: 'NONE', confidence: 0, keypoints: [], source: 'error' })
    }
})

module.exports = router