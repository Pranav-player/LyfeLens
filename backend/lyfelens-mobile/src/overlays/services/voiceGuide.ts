// Voice Guidance System — speaks step-by-step first aid instructions
// Calm, clear voice for panicked bystanders

import * as Speech from 'expo-speech';

type VoiceStep = {
    text: string;
    delay: number; // ms before speaking this step
};

const VOICE_SCRIPTS: Record<string, VoiceStep[]> = {
    CARDIAC_ARREST: [
        { text: "Someone needs CPR. Stay calm. I will guide you step by step.", delay: 0 },
        { text: "Step 1. Kneel beside them. Place the heel of your hand on the center of their chest, between the nipples.", delay: 5000 },
        { text: "Step 2. Put your other hand on top. Lock your elbows straight.", delay: 8000 },
        { text: "Step 3. Push down hard. At least 5 centimeters deep. Push fast. 100 times per minute.", delay: 8000 },
        { text: "Step 4. After 30 pushes, tilt their head back, lift the chin, and give 2 breaths.", delay: 8000 },
        { text: "Keep going. 30 pushes, 2 breaths. Do not stop until help arrives.", delay: 7000 },
    ],
    BLEEDING: [
        { text: "There is severe bleeding. Act now. I will guide you.", delay: 0 },
        { text: "Step 1. Grab a clean cloth, towel, or any fabric. Press it firmly on the wound. Press hard.", delay: 4000 },
        { text: "Step 2. Do NOT lift the cloth to check. Keep pressing firmly.", delay: 6000 },
        { text: "Step 3. If blood soaks through, add more cloth on top. Never remove the first layer.", delay: 6000 },
        { text: "Step 4. If possible, raise the injured area above the heart. This slows the bleeding.", delay: 6000 },
        { text: "Keep pressing until help arrives. You are saving their life.", delay: 6000 },
    ],
    BURNS: [
        { text: "This is a burn injury. Let me help you treat it.", delay: 0 },
        { text: "Step 1. Run cool water gently over the burn. NOT ice cold, just cool tap water.", delay: 4000 },
        { text: "Step 2. Keep the water flowing for 10 to 20 minutes. This reduces damage.", delay: 7000 },
        { text: "Step 3. Gently remove any clothing or jewelry near the burn. But do NOT pull anything stuck to the skin.", delay: 7000 },
        { text: "Step 4. Cover the burn loosely with a clean, non-fluffy bandage or cling film.", delay: 7000 },
        { text: "Never use ice, butter, or toothpaste. Never pop blisters.", delay: 6000 },
    ],
    CHOKING: [
        { text: "This person is choking. Act fast.", delay: 0 },
        { text: "Step 1. Stand behind them. Wrap your arms around their waist.", delay: 3000 },
        { text: "Step 2. Make a fist with one hand. Place it just above their belly button.", delay: 5000 },
        { text: "Step 3. Grab your fist with your other hand. Pull sharply inward and upward.", delay: 5000 },
        { text: "Step 4. Repeat the thrusts. Keep going until the object comes out.", delay: 5000 },
    ],
    SEIZURE: [
        { text: "This person is having a seizure. Stay calm. Do NOT hold them down.", delay: 0 },
        { text: "Step 1. Clear away any sharp objects, furniture, or anything they could hit.", delay: 4000 },
        { text: "Step 2. Place something soft under their head if possible. A jacket or bag.", delay: 6000 },
        { text: "Step 3. Time the seizure. If it lasts more than 5 minutes, call 112 immediately.", delay: 6000 },
        { text: "Step 4. When the seizure stops, gently roll them on their side. This keeps their airway clear.", delay: 7000 },
        { text: "Stay with them until they are fully conscious and aware.", delay: 6000 },
    ],
    STROKE: [
        { text: "This may be a stroke. Every second counts. Call 112 now.", delay: 0 },
        { text: "Remember FAST. F for Face. Ask them to smile. Does one side droop?", delay: 4000 },
        { text: "A for Arms. Ask them to raise both arms. Does one drift down?", delay: 5000 },
        { text: "S for Speech. Ask them to say a simple sentence. Is their speech slurred?", delay: 5000 },
        { text: "T for Time. Note the time symptoms started. Tell the ambulance.", delay: 5000 },
        { text: "Do NOT give them food or water. Keep them comfortable until help arrives.", delay: 5000 },
    ],
    UNCONSCIOUS_BREATHING: [
        { text: "This person is unconscious but breathing. Let me guide you.", delay: 0 },
        { text: "Step 1. Gently tilt their head back and lift their chin to keep the airway open.", delay: 4000 },
        { text: "Step 2. Roll them onto their side. This is the recovery position.", delay: 6000 },
        { text: "Step 3. Keep checking their breathing. If they stop breathing, start CPR.", delay: 6000 },
        { text: "Stay with them and keep them warm until help arrives.", delay: 5000 },
    ],
};

let currentCondition: string | null = null;
let timeouts: ReturnType<typeof setTimeout>[] = [];
let currentStep = 0;
let stepCallback: ((step: number, total: number) => void) | null = null;

export const startVoiceGuide = (
    condition: string,
    onStepChange?: (step: number, total: number) => void
) => {
    // Fallback to static scripts if dynamic fetch isn't used
    const steps = VOICE_SCRIPTS[condition]?.map(s => s.text) || ["Emergency condition active. Keep calm."];
    startDynamicVoiceGuide(condition, steps, onStepChange);
};

export const startDynamicVoiceGuide = (
    conditionId: string,
    steps: string[],
    onStepChange?: (step: number, total: number) => void
) => {
    if (conditionId === currentCondition) return;

    stopVoiceGuide();
    currentCondition = conditionId;
    currentStep = 0;
    stepCallback = onStepChange || null;

    if (!steps || steps.length === 0) return;

    let cumulativeDelay = 0;

    steps.forEach((text, index) => {
        // Calculate dynamic delay based on word count (roughly 300ms per word + 2000ms pause)
        const wordCount = text.split(' ').length;
        const delay = index === 0 ? 0 : (wordCount * 300) + 2000;
        
        cumulativeDelay += index === 0 ? 0 : delay;

        const timeout = setTimeout(() => {
            currentStep = index + 1;
            if (stepCallback) stepCallback(currentStep, steps.length);

            Speech.speak(text, {
                language: 'en-US',
                pitch: 1.0,
                rate: 0.85, 
            });
        }, cumulativeDelay);

        timeouts.push(timeout);
    });
};

export const stopVoiceGuide = () => {
    Speech.stop();
    timeouts.forEach(clearTimeout);
    timeouts = [];
    currentCondition = null;
    currentStep = 0;
    stepCallback = null;
};

export const getCurrentStep = () => currentStep;

export const getStepText = (condition: string, step: number): string => {
    // Kept for backwards compatibility, though Groq text will be managed in component state
    const steps = VOICE_SCRIPTS[condition];
    if (!steps || step <= 0) return '';
    return steps[Math.min(step - 1, steps.length - 1)]?.text || '';
};

export const getTotalSteps = (condition: string): number => {
    return VOICE_SCRIPTS[condition]?.length || 0;
};
