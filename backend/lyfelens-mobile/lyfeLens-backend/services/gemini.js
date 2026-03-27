const Groq = require('groq-sdk')
const scenarios = require('../data/scenarios')

// Try Groq first (free, fast), fall back to Gemini
let client = null
let useGroq = false

try {
    if (process.env.GROQ_KEY) {
        client = new Groq({ apiKey: process.env.GROQ_KEY })
        useGroq = true
        console.log('[AI] Using Groq (Llama Vision) — free, no quota issues')
    }
} catch (e) {
    console.log('[AI] Groq not available, trying Gemini')
}

// Gemini fallback
let geminiModel = null
try {
    const { GoogleGenerativeAI } = require('@google/generative-ai')
    if (process.env.GEMINI_KEY) {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY)
        geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' })
        if (!useGroq) console.log('[AI] Using Gemini 2.0 Flash Lite')
    }
} catch (e) {
    console.log('[AI] Gemini not available')
}

const SYSTEM_PROMPT = `You are a medical emergency detection AI for a first-aid AR app called LyfeLens.
Look at the image very carefully and return ONLY a raw JSON object.
No markdown, no code blocks, no explanation, no extra text.

If you see a clear medical emergency, return:
{"condition": "CARDIAC_ARREST | BLEEDING | FRACTURE | UNCONSCIOUS_BREATHING | BURNS | CHOKING | SEIZURE | STROKE", "confidence": 0-100, "body_part_detected": "chest | left_arm | right_arm | left_leg | right_leg | head | full_body"}

If the scene looks NORMAL, return:
{"condition": "NONE", "confidence": 99, "body_part_detected": "none"}

Do NOT default to CARDIAC_ARREST unless you clearly see an unconscious person needing CPR.`

// ─── Groq (Llama 3.2 Vision) ───
const analyzeWithGroq = async (imageBase64, audioContext, moveNetHint) => {
    let context = ''
    if (moveNetHint) context = `\nPose detection hint: MoveNet detected "${moveNetHint}".`
    if (audioContext) context += `\nAudio: ${audioContext}`

    const response = await client.chat.completions.create({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
            {
                role: 'user',
                content: [
                    {
                        type: 'image_url',
                        image_url: {
                            url: `data:image/jpeg;base64,${imageBase64}`
                        }
                    },
                    {
                        type: 'text',
                        text: SYSTEM_PROMPT + context
                    }
                ]
            }
        ],
        temperature: 0.1,
        max_tokens: 200
    })

    const text = response.choices[0]?.message?.content?.trim() || ''
    return text
}

// ─── Gemini ───
const analyzeWithGemini = async (imageBase64, audioContext, moveNetHint) => {
    let context = `Audio context: ${audioContext || ''}`
    if (moveNetHint) context += `\nPose detection hint: MoveNet detected "${moveNetHint}".`

    const parts = [
        { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
        `${SYSTEM_PROMPT}\n${context}`
    ]
    const result = await geminiModel.generateContent(parts)
    return result.response.text().trim()
}

// ─── Main entry point ───
const analyzeScene = async (imageBase64, audioContext = '', moveNetHint = null) => {
    try {
        let text = ''

        if (useGroq && client) {
            text = await analyzeWithGroq(imageBase64, audioContext, moveNetHint)
            console.log('[Groq] Raw response:', text.substring(0, 100))
        } else if (geminiModel) {
            text = await analyzeWithGemini(imageBase64, audioContext, moveNetHint)
            console.log('[Gemini] Raw response:', text.substring(0, 100))
        } else {
            console.log('[AI] No AI provider available!')
            return { condition_code: 'NONE', confidence: 0 }
        }

        // Clean markdown artifacts
        const clean = text.replace(/```json|```/g, '').trim()
        const parsed = JSON.parse(clean)

        console.log(`[AI] Detected: ${parsed.condition} (confidence: ${parsed.confidence}%)`)

        if (parsed.condition === 'NONE') {
            return { condition_code: 'NONE', confidence: parsed.confidence || 99 }
        }

        const scenarioData = scenarios[parsed.condition] || scenarios['CARDIAC_ARREST']

        return {
            ...scenarioData,
            condition_code: parsed.condition,
            confidence: parsed.confidence || 90,
            body_part_detected: parsed.body_part_detected || 'chest'
        }
    } catch (e) {
        console.log('[AI] Error:', e.message)
        return { condition_code: 'NONE', confidence: 0 }
    }
}

module.exports = { analyzeScene }
