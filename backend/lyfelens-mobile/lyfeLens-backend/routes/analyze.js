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

// ─── Helper: run MoveNet and return ALL fields including heuristic scene ─────
// Returns: { keypoints, hasPerson, rescuerArmsBent, scene }
// `scene` = heuristic pose classification (CARDIAC_ARREST / CHOKING / SEIZURE / null)
// When scene is non-null we can return IMMEDIATELY without any AI call!
const runMoveNet = async (imageBase64) => {
    if (!moveNetReady || !processFrame || !imageBase64) {
        return { keypoints: [], hasPerson: false, rescuerArmsBent: false, scene: null }
    }
    try {
        const t0 = Date.now()
        const result = await processFrame(imageBase64)
        console.log(`[MoveNet] ${Date.now() - t0}ms — scene=${result.scene || 'null'} hasPerson=${result.hasPerson}`)
        return {
            keypoints: result.keypoints || [],
            hasPerson: result.hasPerson || false,
            rescuerArmsBent: result.rescuerArmsBent || false,
            scene: result.scene || null          // ← Heuristic result from classifier.js
        }
    } catch (e) {
        console.log('[MoveNet] Error:', e.message)
        return { keypoints: [], hasPerson: false, rescuerArmsBent: false, scene: null }
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
    const t_start = Date.now()
    const { sessionId, imageBase64, audioContext, lat, lng, activeCondition, hasPerson: personHint } = req.body

    try {

        // ═══════════════════════════════════════════════════════════════════
        // TRACKING FAST-PATH — Emergency already active
        // Just run MoveNet for fresh keypoints → echo same condition back.
        // No AI. Runs at ~800ms and keeps AR anchors smooth.
        // ═══════════════════════════════════════════════════════════════════
        if (activeCondition && activeCondition !== 'NONE') {
            const mv = await runMoveNet(imageBase64)
            console.log(`[Tracking] ${Date.now() - t_start}ms`)
            return res.json({
                condition_code: activeCondition,
                confidence: 99,
                keypoints: mv.keypoints,
                hasPerson: mv.hasPerson,
                rescuerArmsBent: mv.rescuerArmsBent,
                source: 'tracking_cache',
                overlay_anchor: getAnchor(mv.keypoints, activeCondition)
            })
        }

        // ═══════════════════════════════════════════════════════════════════
        // PATH A — Person detected last frame (personHint = true)
        //
        // ⚡ FAST-TIER-1: Run MoveNet → if heuristic classifier fires
        //    (isLying / isChoking / isSeizure) → return INSTANTLY, zero AI!
        //    This is sub-100ms on top of MoveNet time.
        //
        // ⚡ FAST-TIER-2: If heuristic didn't match → send keypoints as TEXT
        //    to Groq llama-3.1-8b-instant (~150ms, chat quota, no image!)
        //    → CARDIAC_ARREST / CHOKING / SEIZURE
        // ═══════════════════════════════════════════════════════════════════
        if (personHint) {
            console.log('[Path A] Person expected → MoveNet first')
            const mv = await runMoveNet(imageBase64)

            if (mv.hasPerson) {
                // ─── TIER 1: Heuristic classifier (instant, no API call) ───
                if (mv.scene) {
                    console.log(`[Path A/Heuristic] ⚡ ${mv.scene} — no AI needed! (${Date.now() - t_start}ms total)`)
                    const response = buildResponse(mv.scene, 88, mv.keypoints, true, 'movenet-heuristic', { rescuerArmsBent: mv.rescuerArmsBent })
                    saveSession(sessionId, { ...response, lat: lat || 0, lng: lng || 0 })
                    return res.json(response)
                }

                // ─── TIER 2+3: Groq KP text AND Groq Vision run in PARALLEL ─
                // Vision kicks off immediately while text processes keypoints.
                // If text fires → return instantly (vision result is discarded).
                // If text misses → vision result is ALREADY READY (ran during text).
                // Zero extra latency added compared to text-only Path A.
                console.log('[Path A] Heuristic null → KP text + Vision in PARALLEL')
                const visionPromise = imageBase64
                    ? analyzeScene(imageBase64, audioContext || '', null).catch(e => {
                        console.log('[Groq/Vision/BG] Error:', e.message)
                        return { condition_code: 'NONE', confidence: 0 }
                    })
                    : Promise.resolve({ condition_code: 'NONE', confidence: 0 })

                let kpResult = null
                try {
                    const t1 = Date.now()
                    kpResult = await analyzeFromKeypoints(mv.keypoints)
                    console.log(`[Groq/KP] ${Date.now() - t1}ms`)
                    if (kpResult && kpResult.condition_code && kpResult.condition_code !== 'NONE') {
                        console.log(`[Groq/KP] ✅ ${kpResult.condition_code} (${kpResult.confidence}%) — total ${Date.now() - t_start}ms`)
                        const response = buildResponse(kpResult.condition_code, kpResult.confidence, mv.keypoints, true, 'groq-kp', { rescuerArmsBent: mv.rescuerArmsBent })
                        saveSession(sessionId, { ...response, lat: lat || 0, lng: lng || 0 })
                        return res.json(response)
                    }
                    console.log('[Groq/KP] No emergency pose — awaiting Vision result')
                } catch (e) {
                    console.log('[Groq/KP] Error:', e.message)
                }

                // KP text found nothing — await the already-running Vision result
                const visionResult = await visionPromise
                if (visionResult && visionResult.condition_code && visionResult.condition_code !== 'NONE') {
                    console.log(`[Groq/Vision] ✅ ${visionResult.condition_code} — total ${Date.now() - t_start}ms`)
                    const response = buildResponse(visionResult.condition_code, visionResult.confidence || 90, mv.keypoints, true, 'groq-vision-pathA')
                    saveSession(sessionId, { ...response, lat: lat || 0, lng: lng || 0 })
                    return res.json(response)
                }

                // No emergency detected by any method
                return res.json({ condition_code: 'NONE', confidence: 95, keypoints: mv.keypoints, hasPerson: true, source: 'clear' })
            }

            // personHint was true but MoveNet didn't confirm — fall to Path B
            console.log('[Path A] MoveNet did not confirm person → Path B')
        }

        // ═══════════════════════════════════════════════════════════════════
        // PATH B — No person (close-up injury scan)
        //
        // ⚡ PARALLEL EXECUTION: Run Groq Vision AND MoveNet at the same time!
        //    Previously sequential → 3-4s total.
        //    Now parallel → max(Groq_time, MoveNet_time) ≈ 2-3s.
        //    MoveNet finishes in ~500ms while Groq Vision runs in background.
        // ═══════════════════════════════════════════════════════════════════
        console.log('[Path B] No person → Groq Vision + MoveNet in PARALLEL')

        const t1 = Date.now()
        const [visionResult, mv] = await Promise.all([
            // Groq Vision: burn / bleed / cut detection from image
            imageBase64
                ? analyzeScene(imageBase64, audioContext || '', null).catch(e => {
                    console.log('[Groq/Vision] Error:', e.message)
                    return { condition_code: 'NONE', confidence: 0 }
                })
                : Promise.resolve({ condition_code: 'NONE', confidence: 0 }),

            // MoveNet: get AR coordinates in parallel (independent of vision result)
            runMoveNet(imageBase64)
        ])

        console.log(`[Path B] Parallel done in ${Date.now() - t1}ms — vision=${visionResult.condition_code} movenet=${mv.scene || 'null'} hasPerson=${mv.hasPerson}`)

        // ⚡ MoveNet heuristic wins — person detected lying/choking in this frame!
        // This covers the case where hasPerson was false on the previous frame but
        // MoveNet now confirms a person with a clear pose emergency.
        if (mv.hasPerson && mv.scene) {
            console.log(`[Path B/MoveNet] ✅ Heuristic: ${mv.scene} — total ${Date.now() - t_start}ms`)
            const response = buildResponse(mv.scene, 88, mv.keypoints, true, 'movenet-heuristic', { rescuerArmsBent: mv.rescuerArmsBent })
            saveSession(sessionId, { ...response, lat: lat || 0, lng: lng || 0 })
            return res.json(response)
        }

        // Groq Vision found an injury (burn / bleed / cut)
        if (visionResult && visionResult.condition_code && visionResult.condition_code !== 'NONE') {
            console.log(`[Groq/Vision] ✅ ${visionResult.condition_code} — total ${Date.now() - t_start}ms`)
            const response = buildResponse(visionResult.condition_code, visionResult.confidence || 90, mv.keypoints, mv.hasPerson, 'groq-vision')
            saveSession(sessionId, { ...response, lat: lat || 0, lng: lng || 0 })
            return res.json(response)
        }

        // Nothing detected
        console.log(`[Clear] total ${Date.now() - t_start}ms`)
        return res.json({ condition_code: 'NONE', confidence: 99, keypoints: mv.keypoints, hasPerson: mv.hasPerson, source: 'clear' })

    } catch (err) {
        console.error('[Route] Analyze error:', err.message)
        return res.json({ condition_code: 'NONE', confidence: 0, keypoints: [], source: 'error' })
    }
})

module.exports = router