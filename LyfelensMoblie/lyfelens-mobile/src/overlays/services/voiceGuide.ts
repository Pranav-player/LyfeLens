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
    BURNS_FIRST_DEGREE: [
        { text: "This is a first degree burn. Superficial skin damage only.", delay: 0 },
        { text: "Step 1. Hold the burn under cool running water for 10 to 20 minutes.", delay: 5000 },
        { text: "Step 2. Do NOT use ice. It causes further tissue damage.", delay: 6000 },
        { text: "Step 3. Apply aloe vera gel to soothe the area.", delay: 5000 },
        { text: "Step 4. Cover loosely with a clean bandage to protect.", delay: 5000 },
        { text: "This burn should heal within a few days.", delay: 5000 },
    ],
    BURNS_SECOND_DEGREE: [
        { text: "Warning. This is a second degree burn. Blisters are present.", delay: 0 },
        { text: "Step 1. Run cool water over the burn immediately for 20 minutes.", delay: 5000 },
        { text: "Step 2. Do NOT pop or drain any blisters. They protect the skin underneath.", delay: 6000 },
        { text: "Step 3. Do NOT apply any cream, butter, or toothpaste.", delay: 5000 },
        { text: "Step 4. Cover loosely with cling film or a sterile non-fluffy dressing.", delay: 6000 },
        { text: "Seek medical attention if the burn is larger than your palm.", delay: 5000 },
    ],
    BURNS_THIRD_DEGREE: [
        { text: "Critical. This is a third degree burn. Call emergency services now.", delay: 0 },
        { text: "Step 1. Call 112 or your local emergency number immediately.", delay: 4000 },
        { text: "Step 2. Do NOT run water on a third degree burn.", delay: 5000 },
        { text: "Step 3. Do NOT remove any clothing or material stuck to the burn.", delay: 5000 },
        { text: "Step 4. Cover the area with a clean, dry cloth or sheet.", delay: 5000 },
        { text: "Step 5. Keep the person warm and monitor for signs of shock.", delay: 5000 },
        { text: "Do NOT apply any ointment, cream, or medication.", delay: 5000 },
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
    MINOR_CUT: [
        { text: "This is a minor cut. Bleeding is minimal.", delay: 0 },
        { text: "Step 1. Wash your hands before touching the wound.", delay: 4000 },
        { text: "Step 2. Gently clean the wound with cool tap water.", delay: 5000 },
        { text: "Step 3. Apply a clean sterile bandage or plaster.", delay: 5000 },
    ],
    MAJOR_CUT: [
        { text: "This is a major cut. The wound edges are separated.", delay: 0 },
        { text: "Step 1. Do not wash the wound. Apply a clean dressing or cloth directly over it.", delay: 6000 },
        { text: "Step 2. Press firmly to control bleeding.", delay: 5000 },
        { text: "Step 3. Keep the cloth in place and seek professional medical stitches.", delay: 6000 },
    ],
    MINOR_BLEEDING: [
        { text: "There is some bleeding, but it is slow.", delay: 0 },
        { text: "Step 1. Apply gentle continuous pressure with a clean cloth.", delay: 5000 },
        { text: "Step 2. Keep the area elevated if possible to slow blood flow.", delay: 5000 },
    ],
    SEVERE_BLEEDING: [
        { text: "Warning. Severe bleeding detected. You must act immediately.", delay: 0 },
        { text: "Step 1. Find a clean cloth and push down hard directly on the wound.", delay: 6000 },
        { text: "Step 2. Keep constant, heavy pressure without letting up to check.", delay: 6000 },
        { text: "Step 3. If blood soaks through, add another cloth on top. Do not remove the first one.", delay: 7000 },
        { text: "Call an ambulance. Keep pushing hard.", delay: 5000 },
    ],
    POISONING: [
        { text: "Warning. Possible poisoning or chemical exposure detected.", delay: 0 },
        { text: "Step 1. Ensure the scene is safe for you. Do not touch chemicals with bare hands.", delay: 6000 },
        { text: "Step 2. Find the poison container or pills if possible so you can tell the medics.", delay: 6000 },
        { text: "Step 3. Do not induce vomiting unless told to do so by Poison Control.", delay: 6000 },
        { text: "Call 112 or local emergency services immediately.", delay: 5000 },
    ],
};

let currentCondition: string | null = null;
let currentSteps: string[] = [];
let currentStepIndex = 0; // 0-based internal
let stepCallback: ((step: number, total: number) => void) | null = null;

// Kept for backwards compatibility
export const startVoiceGuide = (
    condition: string,
    onStepChange?: (step: number, total: number) => void
) => {
    const steps = VOICE_SCRIPTS[condition]?.map(s => s.text) || ["Emergency active."];
    initDynamicVoiceGuide(condition, steps, onStepChange);
};

export const initDynamicVoiceGuide = (
    conditionId: string,
    steps: string[],
    onStepChange?: (step: number, total: number) => void
) => {
    console.log(`[VoiceGuide] Init for ${conditionId} with ${steps.length} steps`);
    
    stopVoiceGuide();
    currentCondition = conditionId;
    currentSteps = steps;
    currentStepIndex = 0;
    stepCallback = onStepChange || null;

    if (!steps || steps.length === 0) return;

    playCurrentStep();
};

const playCurrentStep = () => {
    if (currentStepIndex < 0 || currentStepIndex >= currentSteps.length) return;
    
    const text = currentSteps[currentStepIndex];
    if (stepCallback) stepCallback(currentStepIndex + 1, currentSteps.length);

    Speech.stop();
    Speech.speak(text, {
        language: 'en-US',
        pitch: 1.0,
        rate: 1.25, // INCREASED SPEED FOR URGENCY
        onDone: () => {
            // Auto advance after a brief pause
            if (currentStepIndex < currentSteps.length - 1) {
                setTimeout(() => nextStep(), 800); // reduced pause between steps
            } else {
                setTimeout(() => {
                    Speech.speak("Emergency sequence complete. Keep the patient stable and wait for medical professionals.", { rate: 1.15 });
                }, 2000);
            }
        }
    });
};

export const nextStep = () => {
    if (currentStepIndex < currentSteps.length - 1) {
        currentStepIndex++;
        playCurrentStep();
    }
};

export const prevStep = () => {
    if (currentStepIndex > 0) {
        currentStepIndex--;
        playCurrentStep();
    }
};

export const repeatStep = () => {
    playCurrentStep();
};

export const stopVoiceGuide = () => {
    Speech.stop();
    currentCondition = null;
    currentSteps = [];
    currentStepIndex = 0;
    stepCallback = null;
};

export const getCurrentStep = () => currentStepIndex + 1;

export const getStepText = (condition: string, step: number): string => {
    const steps = VOICE_SCRIPTS[condition];
    if (!steps || step <= 0) return '';
    return steps[Math.min(step - 1, steps.length - 1)]?.text || '';
};

export const getTotalSteps = (condition: string): number => {
    return VOICE_SCRIPTS[condition]?.length || 0;
};
