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
Look at the image very carefully and return ONLY a raw JSON object. No markdown, no extra text.

You MUST detect these exact classes:
1. "minor_cut": Small superficial break in skin, < 2-3 cm, very shallow depth, edges mostly closed, minimal redness, bleeding slow or absent. Ex: paper cuts, small knife scratches, abrasions.
2. "major_cut": Large or deep laceration, > 3-5 cm, skin edges separated, exposing fat/muscle tissue, significant redness/swelling, active bleeding.
3. "minor_bleeding": Slow bleeding, small droplets or slight oozing, localized blood, no continuous flow.
4. "severe_bleeding": Continuous/heavy blood flow, spreading quickly, pooling, rapid dripping, large area.
5. "poisoning": Look for scattered pills, open chemical bottles, foaming at the mouth, or toxic context clues.
6. "fracture": Look for unnatural angulation/deformity of a limb, swelling, bruising, skin tenting, or exposed bone.
7. "stroke": Look for facial asymmetry (one side of face or lip drooping), uneven physical posture, paralyzed arm.
8. "choking": Look for hands violently clutching the throat (Universal Choking Sign), flushed/cyanotic face, panicked expression.
9. "seizure": Look for spasming or rigid awkward body posture on the ground, clenched jaw, foaming, or rigid extension of limbs.
10. "unconscious_breathing": Person lying down lying still with eyes closed, unresponsive but NOT dead (look for subtle chest movement or recovery position).
11. "cardiac_arrest": Unconscious, flat on back, NO signs of breathing, entirely lifeless. DO NOT OVERPREDICT this unless clearly lifeless.
12. "burns": Scalded skin, blistering, charring, severe redness from heat/fire.
13. "normal_skin": No injury.

Analyze Wound Features, Blood Features, Orthopedic Features (angulation), and Motion/Context.

Return exactly this JSON format if ANY emergency is found:
{
  "injury_detected": true,
  "injury_type": "<one of the exact classes above>",
  "confidence": <0.0-1.0 float>,
  "wound_size_estimate": "<small|medium|large|none>",
  "blood_flow": "<absent|slow|oozing|continuous|heavy|none>",
  "body_part_detected": "<chest|left_arm|right_arm|left_leg|right_leg|head|full_body>"
}

If the scene looks completely normal or there is no emergency, return:
{
  "injury_detected": false,
  "injury_type": "none",
  "confidence": 0.99,
  "wound_size_estimate": "none",
  "blood_flow": "none",
  "body_part_detected": "none"
}`

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

        // Extract JSON specifically using regex to ignore any conversational preamble
        const match = text.match(/\{[\s\S]*?\}/)
        if (!match) {
            console.log('[AI] Could not find JSON in response:', text.substring(0, 100))
            return { condition_code: 'NONE', confidence: 0 }
        }

        const parsed = JSON.parse(match[0])

        const injuryType = parsed.injury_type ? parsed.injury_type.toUpperCase() : 'NONE';
        const isEmergency = parsed.injury_detected && injuryType !== 'NONE' && injuryType !== 'NORMAL_SKIN';

        console.log(`[AI] Deep Medical Scan: ${injuryType} (confidence: ${parsed.confidence}%)`)
        if (parsed.wound_size_estimate) console.log(`[AI] -> Wound: ${parsed.wound_size_estimate}, Blood: ${parsed.blood_flow}`)

        if (!isEmergency) {
            return { condition_code: 'NONE', confidence: parsed.confidence || 99 }
        }

        // We bypass local scenarioData here because the new deep forensic classes
        // (MINOR_CUT, SEVERE_BLEEDING) don't exist in the legacy scenarios json.
        return {
            condition_code: injuryType,
            confidence: (parsed.confidence * 100) || 90, // AI returns 0.0-1.0
            body_part_detected: parsed.body_part_detected || 'none',
            forensics: {
                wound_size: parsed.wound_size_estimate,
                blood_flow: parsed.blood_flow
            }
        }
    } catch (e) {
        console.log('[AI] Error:', e.message)
        return { condition_code: 'NONE', confidence: 0 }
    }
}

module.exports = { analyzeScene }
