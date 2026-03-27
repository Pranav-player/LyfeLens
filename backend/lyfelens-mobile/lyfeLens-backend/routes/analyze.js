const express = require('express')
const router = express.Router()
const NodeCache = require('node-cache')
const { analyzeScene } = require('../services/gemini')
const { saveSession } = require('../services/firebase')
const scenarios = require('../data/scenarios')

const cache = new NodeCache()
const sessionMap = {}

// Pre-warm all 8 scenarios on startup
Object.entries(scenarios).forEach(([key, val]) => {
    cache.set(key, { ...val, condition_code: key, confidence: 95, source: 'prewarm' })
})
console.log('Cache pre-warmed with 8 scenarios')

router.post('/', async (req, res) => {
    const { sessionId, sceneType, imageBase64, audioContext, lat, lng } = req.body

    // 1. Same session — return instantly
    if (sessionMap[sessionId]) {
        return res.json({ ...sessionMap[sessionId], source: 'session' })
    }

    // 2. Scene type known — return from cache instantly
    if (sceneType && cache.has(sceneType.toUpperCase())) {
        const result = cache.get(sceneType.toUpperCase())
        sessionMap[sessionId] = result

        // Save async — don't block response
        saveSession(sessionId, { ...result, lat: lat || 0, lng: lng || 0 })

        return res.json({ ...result, source: 'cache' })
    }

    // 3. Image sent — call Gemini (first time only)
    if (imageBase64) {
        const result = await analyzeScene(imageBase64, audioContext || '')
        sessionMap[sessionId] = result
        cache.set(result.condition_code, result)

        // Save async
        saveSession(sessionId, { ...result, lat: lat || 0, lng: lng || 0 })

        return res.json({ ...result, source: 'gemini' })
    }

    // 4. Fallback — CPR default
    const fallback = { ...scenarios['CARDIAC_ARREST'], condition_code: 'CARDIAC_ARREST', source: 'fallback' }
    return res.json(fallback)
})

module.exports = router