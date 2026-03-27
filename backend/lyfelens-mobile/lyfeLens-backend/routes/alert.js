const express = require('express')
const router = express.Router()
const { saveSession } = require('../services/firebase')

router.post('/', async (req, res) => {
    const { sessionId, lat, lng, condition, message } = req.body

    console.log(`🚨 EMERGENCY ALERT`)
    console.log(`   Condition: ${condition}`)
    console.log(`   Location:  ${lat}, ${lng}`)
    console.log(`   Session:   ${sessionId}`)

    // Save emergency flag to Firebase
    await saveSession(`alert_${sessionId}`, {
        condition,
        lat: lat || 0,
        lng: lng || 0,
        emergency: true,
        message: message || 'Emergency triggered from LyfeLens',
    })

    res.json({
        success: true,
        message: 'Emergency recorded. Call 112 immediately.',
        coordinates: { lat, lng }
    })
})

module.exports = router