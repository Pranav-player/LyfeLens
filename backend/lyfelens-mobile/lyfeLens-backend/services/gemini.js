const { GoogleGenerativeAI } = require('@google/generative-ai')
const scenarios = require('../data/scenarios')

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

const SYSTEM_PROMPT = `
You are a paramedic AI. Look at the image and return ONLY this JSON.
No markdown. No explanation. Nothing else.

{
  "condition": "CARDIAC_ARREST | BLEEDING | FRACTURE | UNCONSCIOUS_BREATHING | BURNS | CHOKING | SEIZURE | STROKE",
  "confidence": 0-100,
  "body_part_detected": "chest | left_arm | right_arm | left_leg | right_leg | head | full_body"
}
`

const analyzeScene = async (imageBase64, audioContext = '') => {
    try {
        const parts = [
            { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
            `${SYSTEM_PROMPT}\nAudio context: ${audioContext}`
        ]
        const result = await model.generateContent(parts)
        const text = result.response.text().trim()

        // Clean any accidental markdown
        const clean = text.replace(/```json|```/g, '').trim()
        const parsed = JSON.parse(clean)

        // Get full scenario data from our local store
        const scenarioData = scenarios[parsed.condition] || scenarios['CARDIAC_ARREST']

        return {
            ...scenarioData,
            condition_code: parsed.condition,
            confidence: parsed.confidence || 90,
        }
    } catch (e) {
        console.log('Gemini error:', e.message)
        // Always return something — never crash
        return { ...scenarios['CARDIAC_ARREST'], condition_code: 'CARDIAC_ARREST', confidence: 70 }
    }
}

module.exports = { analyzeScene }
