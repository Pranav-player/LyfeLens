/**
 * groqService.ts — Fetches step-by-step medical instructions from Groq (Llama-3).
 * Full coverage for all 8 emergency conditions with rich offline fallbacks.
 * Robust JSON parsing handles markdown-wrapped or plain JSON responses.
 */

const DEFAULT_MOCKS: Record<string, string[]> = {
  CARDIAC_ARREST: [
    "Kneel beside them — place the heel of your hand on the center of their chest.",
    "Lock your other hand on top. Straighten your elbows and use your body weight.",
    "Push DOWN hard — at least 5 cm deep. Push fast: 100–120 times per minute.",
    "After 30 compressions, give 2 rescue breaths: tilt head back, lift chin, breathe.",
    "Keep going — 30 compressions, 2 breaths — until the ambulance arrives.",
  ],
  BURNS: [
    "Run cool (not cold) tap water over the burn area immediately. Start now.",
    "Keep water flowing continuously for at least 10 full minutes. Do NOT stop early.",
    "Gently remove clothing or jewelry near the burn — unless it is stuck to the skin.",
    "Cover the cooled burn loosely with cling film or a clean non-fluffy cloth.",
    "Never use ice, butter, toothpaste, or oils. Never pop blisters.",
  ],
  BLEEDING: [
    "Grab a clean cloth, towel, or clothing. Press it hard and firmly onto the wound.",
    "Keep firm pressure — do NOT lift the cloth to check. Add more cloth on top if soaked.",
    "Raise the injured area above heart level to slow blood flow.",
    "If bleeding is severe on a limb, tie a tight tourniquet above the wound.",
    "Keep pressing firmly until emergency services arrive. You are saving their life.",
  ],
  CHOKING: [
    "Stand behind them. Place one foot forward for balance and stability.",
    "Make a fist. Place it just above their belly button, well below the chest.",
    "Grab your fist with your other hand. Pull sharply INWARD and UPWARD.",
    "Repeat up to 5 thrusts. Check each time if the object has been cleared.",
    "If they become unconscious, lower them to the ground carefully and begin CPR.",
  ],
  SEIZURE: [
    "Stay calm and start timing the seizure — critical if it lasts over 5 minutes.",
    "Clear the area of sharp objects, furniture, or anything they could hit.",
    "Cushion their head with something soft — a jacket, bag, or folded clothing.",
    "Do NOT hold them down, restrain them, or put anything in their mouth.",
    "When it stops, gently roll them onto their side — the recovery position.",
  ],
  STROKE: [
    "Call 112 NOW — every second counts. Note the exact time symptoms began.",
    "F — Face: Ask them to smile. Does one side of the face droop?",
    "A — Arms: Ask them to raise both arms. Does one drift downward?",
    "S — Speech: Ask them to repeat a sentence. Is speech slurred or confused?",
    "Keep them still and calm. No food, no water, no medication. Wait for help.",
  ],
  FRACTURE: [
    "Do NOT try to straighten or move the broken bone — leave it exactly as it is.",
    "Immobilize the area with padding above and below the fracture site.",
    "If you have a splint: rigid object + bandage, secured above AND below the break.",
    "Check blood flow every few minutes: feel for pulse, warmth, and sensation below.",
    "Elevate the limb gently if possible. Keep the person warm, still, and calm.",
  ],
  UNCONSCIOUS_BREATHING: [
    "Shout their name and tap their shoulder firmly to check for a response.",
    "Tilt their head back and lift their chin gently to open the airway.",
    "Roll them onto their side into the recovery position — this prevents choking.",
    "Bend the top knee forward to keep them stable in the recovery position.",
    "Check their breathing every 2 minutes. If it stops, begin CPR immediately.",
  ],
};

/** Robust JSON extraction — handles Llama returning markdown or plain JSON */
function parseSteps(raw: string): string[] {
  // Try 1: direct parse
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length >= 3) return parsed;
  } catch (_) {}

  // Try 2: extract JSON array from within markdown code block
  const match = raw.match(/\[[\s\S]*?\]/);
  if (match) {
    try {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed) && parsed.length >= 3) return parsed;
    } catch (_) {}
  }

  // Try 3: numbered list "1. step text"
  const lines = raw
    .split('\n')
    .filter(l => /^\d+[\.\)]/.test(l))
    .map(l => l.replace(/^\d+[\.\)]\s*/, '').trim())
    .filter(l => l.length > 0);
  if (lines.length >= 3) return lines;

  return [];
}

export async function getMedicalInstructionsFromGroq(condition: string): Promise<string[]> {
  const fallback = DEFAULT_MOCKS[condition] ?? [
    'Emergency detected. Stay calm.',
    'Call 112 immediately and stay on the line.',
    'Stay with the person until help arrives.',
    'Follow any instructions given by the operator.',
    'Do not leave them alone.',
  ];

  const groqKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
  if (!groqKey) {
    console.warn('⚠️ No EXPO_PUBLIC_GROQ_API_KEY found. Using offline instructions.');
    return fallback;
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          {
            role: 'system',
            content:
              'You are a certified emergency medical AI. Give exactly 5 short, urgent, numbered instructions for a bystander treating this emergency condition. Return ONLY a valid JSON array of 5 strings. No markdown, no explanation, no extra text. Each instruction must be under 18 words.',
          },
          {
            role: 'user',
            content: `Emergency: ${condition}`,
          },
        ],
        temperature: 0.1,
        max_tokens: 350,
      }),
    });

    if (!response.ok) throw new Error(`Groq API error ${response.status}`);

    const data = await response.json();
    const raw: string = data.choices[0].message.content;
    const steps = parseSteps(raw);

    if (steps.length >= 3) return steps;
    throw new Error('Insufficient steps in response');
  } catch (err) {
    console.error('Groq failed — falling back to offline:', err);
    return fallback;
  }
}
