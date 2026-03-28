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

const SYSTEM_PROMPT = `You are a high-precision medical injury detection AI for LyfeLens, a first-aid AR system.
Analyze the image with extreme forensic detail. Return ONLY raw JSON. No markdown, no text.

=== INJURY CLASSIFICATION (Strict Visual Rules) ===

1. "minor_cut"
   VISUAL: Small superficial skin break, length < 2-3 cm, very shallow depth.
   EDGES: Mostly closed, minimal separation. Appears as thin line or scratch.
   REDNESS: Minimal. No visible tissue exposure (no fat, no muscle).
   BLEEDING: Slow or absent. No droplets.
   EXAMPLES: Paper cuts, small knife scratches, superficial abrasions.

2. "major_cut"
   VISUAL: Large deep laceration, length > 3-5 cm. Wide opening in skin.
   EDGES: Clearly separated, irregular wound edges. Visible wound depth.
   TISSUE: May expose deeper layers — fat tissue (yellow) or muscle (dark red).
   REDNESS: Significant redness or swelling around wound margins.
   BLEEDING: Often associated with active bleeding.

3. "minor_bleeding"
   VISUAL: Slow bleeding. Blood forms small droplets or slight oozing.
   SPREAD: Blood remains localized around wound. Small red patch only.
   FLOW: No continuous flow. No spraying. Drops form gradually.
   COLOR: Red but not visually dominant. Limited blood area.

4. "severe_bleeding"
   VISUAL: Continuous or heavy blood flow. Deep red, visually dominant color.
   SPREAD: Blood spreads quickly across skin or surface. Rapid area expansion.
   PATTERNS: Flowing blood, pooling blood, rapid dripping.
   AREA: Can cover large regions. Large blood pools visible.

5. "poisoning"
   VISUAL: Scattered pills/tablets, open chemical bottles, cleaning product containers.
   PERSON: Foaming at the mouth, unconscious near toxic substances, cyanotic lips.

6. "fracture"
   VISUAL: Unnatural angulation/deformity of a limb. Bone visible through skin in open fractures.
   SWELLING: Significant localized swelling, bruising, skin tenting over bone.

7. "stroke"
   VISUAL: Facial asymmetry — one side of face or lip drooping. Uneven posture. One arm hanging limp.

8. "choking"
   VISUAL: Hands clutching throat (Universal Choking Sign). Flushed or blue/cyanotic face. Panicked expression.

9. "seizure"
   VISUAL: Spasming or rigid body on the ground. Clenched jaw. Foaming. Limbs in rigid extension.

10. "unconscious_breathing"
    VISUAL: Person lying still, eyes closed, unresponsive but with subtle chest movement. Recovery position.

11. "cardiac_arrest"
    VISUAL: Unconscious, flat on back, NO breathing signs, entirely lifeless. DO NOT OVERPREDICT.

12. "burns_first_degree"
    VISUAL: Superficial burn affecting epidermis ONLY.
    COLOR: Uniform redness, inflamed appearance. No white or charred areas.
    TEXTURE: Skin surface remains smooth and intact. No blisters whatsoever.
    MOISTURE: Dry. No wet or shiny surface.
    SWELLING: Mild swelling possible but skin structure intact.
    TISSUE: No deeper tissue exposure. No peeling.
    EXAMPLES: Mild sunburn, light contact burn, brief steam exposure.

13. "burns_second_degree"
    VISUAL: Partial thickness burn into dermis.
    COLOR: Red, pink, or mottled red-and-white. Patchy redness.
    TEXTURE: BLISTERS present — fluid-filled bubbles on skin. Skin may peel or partially break.
    MOISTURE: WET, shiny, glistening surface. Reflective appearance from blister fluid.
    SWELLING: Moderate swelling around burn area.
    TISSUE: Partial skin damage. Dermis visible if blisters ruptured.
    EXAMPLES: Scald burns from hot liquids, strong heat exposure, hot oil splash.

14. "burns_third_degree"
    VISUAL: Full thickness burn through ALL skin layers.
    COLOR: WHITE, WAXY, dark BROWN, or CHARRED BLACK. Never red (nerves destroyed).
    TEXTURE: Thick, LEATHERY, dry and stiff. No blisters (too deep). Irregular deformed surface.
    MOISTURE: Completely DRY. No shiny/wet areas.
    TISSUE: Deep tissue destruction. Fat or muscle may be visible. Skin structure collapsed.
    EXAMPLES: Direct flame burns, electrical burns, prolonged chemical exposure.

15. "normal_skin" — No injury detected.

=== FEATURES TO ANALYZE ===
Wound: length, width, depth (visual estimate), edge separation.
Blood: area, spread rate, flow continuity, color intensity (red spectrum).
Burn Color: redness intensity, white/pale regions, black/charred areas, mottling pattern.
Burn Texture: blister detection (count + size), skin smoothness, leathery texture, peeling.
Burn Moisture: dry vs wet surface, reflective/shiny areas indicating blisters.
Burn Structure: skin deformation, burn region boundaries, area coverage.
Orthopedic: angulation, deformity, swelling asymmetry.

Return this JSON if ANY emergency found:
{
  "injury_detected": true,
  "injury_type": "<one of the 15 classes above>",
  "confidence": <0.0-1.0>,
  "wound_size_estimate": "<small|medium|large|none>",
  "blood_flow": "<absent|slow|oozing|continuous|heavy|none>",
  "burn_degree": "<first|second|third|none>",
  "blisters_detected": <true|false>,
  "burn_area_size": "<small|medium|large|none>",
  "skin_texture": "<smooth|blistered|peeling|leathery|charred|normal>",
  "body_part_detected": "<chest|left_arm|right_arm|left_leg|right_leg|head|full_body>"
}

If completely normal:
{
  "injury_detected": false,
  "injury_type": "none",
  "confidence": 0.99,
  "wound_size_estimate": "none",
  "blood_flow": "none",
  "burn_degree": "none",
  "blisters_detected": false,
  "burn_area_size": "none",
  "skin_texture": "normal",
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
        max_tokens: 300
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

// Rate limit cooldown: when Groq 429s, pause for 5 min
let groqCooldownUntil = 0

// ─── Main entry point ───
const analyzeScene = async (imageBase64, audioContext = '', moveNetHint = null) => {
    try {
        let text = ''
        const now = Date.now()

        // Try Groq first (unless rate-limited)
        if (useGroq && client && now > groqCooldownUntil) {
            try {
                text = await analyzeWithGroq(imageBase64, audioContext, moveNetHint)
                console.log('[Groq] Response OK:', text.substring(0, 80))
            } catch (groqErr) {
                const msg = groqErr.message || ''
                if (msg.includes('429') || msg.includes('rate_limit')) {
                    console.log('[Groq] ⚠️ Rate limited — switching to Gemini for 5 min')
                    groqCooldownUntil = now + 5 * 60 * 1000
                    text = '' // force Gemini fallback below
                } else {
                    console.log('[Groq] Error:', msg.substring(0, 80))
                    text = ''
                }
            }
        }

        // Fallback to Gemini
        if (!text && geminiModel) {
            text = await analyzeWithGemini(imageBase64, audioContext, moveNetHint)
            console.log('[Gemini] Response OK:', text.substring(0, 80))
        }

        if (!text) {
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
        if (parsed.burn_degree && parsed.burn_degree !== 'none') {
            console.log(`[AI] 🔥 BURN FORENSICS:`)
            console.log(`[AI]    Degree: ${parsed.burn_degree}`)
            console.log(`[AI]    Blisters: ${parsed.blisters_detected}`)
            console.log(`[AI]    Area: ${parsed.burn_area_size}`)
            console.log(`[AI]    Texture: ${parsed.skin_texture}`)
        }

        if (!isEmergency) {
            return { condition_code: 'NONE', confidence: parsed.confidence || 99 }
        }

        // We bypass local scenarioData here because the new deep forensic classes
        // (MINOR_CUT, SEVERE_BLEEDING) don't exist in the legacy scenarios json.
        return {
            condition_code: injuryType,
            confidence: (parsed.confidence * 100) || 90,
            body_part_detected: parsed.body_part_detected || 'none',
            forensics: {
                wound_size: parsed.wound_size_estimate,
                blood_flow: parsed.blood_flow,
                burn_degree: parsed.burn_degree || 'none',
                blisters_detected: parsed.blisters_detected || false,
                burn_area_size: parsed.burn_area_size || 'none',
                skin_texture: parsed.skin_texture || 'normal'
            }
        }
    } catch (e) {
        console.log('[AI] Error:', e.message)
        return { condition_code: 'NONE', confidence: 0 }
    }
}

module.exports = { analyzeScene }
