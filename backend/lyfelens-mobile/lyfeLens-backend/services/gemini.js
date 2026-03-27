const { GoogleGenerativeAI } = require('@google/generative-ai')
const scenarios = require('../data/scenarios')

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

const SYSTEM_PROMPT = `
You are a medical emergency detection AI for a first-aid AR app.
Look at the image very carefully and return ONLY a raw JSON object. No markdown, no code blocks, no explanation.

If you see a clear medical emergency, return:
{
  "condition": "CARDIAC_ARREST | BLEEDING | FRACTURE | UNCONSCIOUS_BREATHING | BURNS | CHOKING | SEIZURE | STROKE",
  "confidence": 0-100,
  "body_part_detected": "chest | left_arm | right_arm | left_leg | right_leg | head | full_body"
}

If the scene looks NORMAL (no visible injury, person is healthy, or image is unclear), return:
{
  "condition": "NONE",
  "confidence": 99,
  "body_part_detected": "none"
}

Do NOT default to CARDIAC_ARREST unless you clearly see an unconscious person needing CPR.
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
        // Return NONE on error so app stays in scanning mode — not false CARDIAC_ARREST
        return { condition_code: 'NONE', confidence: 0 }
    }
}

module.exports = { analyzeScene }
