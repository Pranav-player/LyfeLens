require('dotenv').config()
const express = require('express')

const analyzeRoute = require('./routes/analyze')
const alertRoute = require('./routes/alert')
const sessionRoute = require('./routes/session')

const app = express()
app.use(express.json({ limit: '10mb' }))

// Allow ALL cross-origin requests (phone → laptop)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'Content-Type')
    console.log(`[REQUEST] ${req.method} ${req.url} from ${req.ip}`)
    next()
})

// Keep Render.com free tier awake
const SELF_URL = process.env.RENDER_URL || 'http://localhost:3000'
setInterval(() => {
    fetch(`${SELF_URL}/`).catch(() => { })
}, 10 * 60 * 1000)

// Health check
app.get('/', (req, res) => {
    res.json({ status: 'LyfeLens backend running', version: '3.0' })
})

// Routes
app.use('/analyze', analyzeRoute)
app.use('/alert', alertRoute)
app.use('/session', sessionRoute)

const PORT = process.env.PORT || 4000
app.listen(PORT, '0.0.0.0', () => {
    console.log(`LyfeLens backend running on port ${PORT}`)
    console.log(`Accessible at http://172.16.40.207:${PORT}`)
    console.log('All 8 scenarios cached and ready')
})