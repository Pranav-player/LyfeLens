const admin = require('firebase-admin')
const serviceAccount = require('../serviceAccount.json')

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://your-project-default-rtdb.asia-southeast1.firebasedatabase.app'
})

const db = admin.database()

const saveSession = async (sessionId, data) => {
    try {
        await db.ref(`sessions/${sessionId}`).set({
            t: Date.now(),
            condition: data.condition || 'UNKNOWN',
            severity: data.severity || 3,
            lat: data.lat || 0,
            lng: data.lng || 0,
        })
        console.log('Session saved:', sessionId)
    } catch (e) {
        console.log('Firebase save failed:', e.message)
        // Never crash the app if Firebase fails
    }
}

module.exports = { saveSession }