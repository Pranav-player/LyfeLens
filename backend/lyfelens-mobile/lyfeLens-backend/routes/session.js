const express = require('express')
const router = express.Router()

const activeSessions = {}

// Start a new session
router.post('/start', (req, res) => {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    activeSessions[sessionId] = {
        startTime: Date.now(),
        active: true,
    }
    console.log(`Session started: ${sessionId}`)
    res.json({ sessionId, message: 'Session started' })
})

// End session
router.post('/end', (req, res) => {
    const { sessionId } = req.body
    if (activeSessions[sessionId]) {
        const duration = Date.now() - activeSessions[sessionId].startTime
        delete activeSessions[sessionId]
        console.log(`Session ended: ${sessionId} (${Math.round(duration / 1000)}s)`)
    }
    res.json({ success: true })
})

module.exports = router