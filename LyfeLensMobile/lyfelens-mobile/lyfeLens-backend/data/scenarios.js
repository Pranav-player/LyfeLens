module.exports = {
    CARDIAC_ARREST: {
        condition: 'Cardiac Arrest',
        overlay_type: 'CPR_HANDS',
        body_part: 'chest_midpoint',
        severity: 5,
        cause: 'Heart stopped pumping blood',
        golden_time: '4-6 minutes',
        instruction: 'Place both hands on chest. Press down 5cm firmly.',
        do_not: 'Do not stop compressions',
        call_112: true,
        steps: [
            'Place heel of hand on center of chest',
            'Press down hard and fast 100 times per minute',
            'Give 2 rescue breaths after every 30 compressions',
        ]
    },
    BLEEDING: {
        condition: 'Severe Bleeding',
        overlay_type: 'PRESSURE_ARROW',
        body_part: 'left_arm',
        severity: 4,
        cause: 'Blood vessel damaged',
        golden_time: '3-5 minutes',
        instruction: 'Press hard on wound. Do not lift your hand.',
        do_not: 'Do not remove embedded objects',
        call_112: true,
        steps: [
            'Press firmly with cloth or hand',
            'Keep pressing — do not check wound',
            'Raise the limb above heart level',
        ]
    },
    FRACTURE: {
        condition: 'Bone Fracture',
        overlay_type: 'RED_X',
        body_part: 'left_arm',
        severity: 3,
        cause: 'Bone broken from impact',
        golden_time: 'Stable — wait for help',
        instruction: 'Do not move this limb. Keep them still.',
        do_not: 'Do not try to straighten bone',
        call_112: false,
        steps: [
            'Do not move the broken limb',
            'Support it in position found',
            'Cover with cloth to keep warm',
        ]
    },
    UNCONSCIOUS_BREATHING: {
        condition: 'Unconscious — Breathing',
        overlay_type: 'RECOVERY_POSITION',
        body_part: 'chest_midpoint',
        severity: 3,
        cause: 'Unconscious but airway clear',
        golden_time: 'Stable — monitor breathing',
        instruction: 'Roll gently onto side. Tilt head back.',
        do_not: 'Do not leave them alone',
        call_112: true,
        steps: [
            'Tilt head back to open airway',
            'Roll onto left side gently',
            'Monitor breathing every minute',
        ]
    },
    BURNS: {
        condition: 'Burn Injury',
        overlay_type: 'COOL_WATER',
        body_part: 'left_arm',
        severity: 3,
        cause: 'Tissue damaged by heat',
        golden_time: '10 min cool water critical',
        instruction: 'Pour cool water here for 10 minutes.',
        do_not: 'Do not use ice or butter',
        call_112: false,
        steps: [
            'Run cool water for 10 minutes',
            'Remove clothing near burn gently',
            'Cover loosely with clean cloth',
        ]
    },
    CHOKING: {
        condition: 'Choking',
        overlay_type: 'HEIMLICH_GUIDE',
        body_part: 'chest_midpoint',
        severity: 5,
        cause: 'Airway blocked by object',
        golden_time: 'Under 2 minutes',
        instruction: 'Stand behind. Pull sharply inward and up.',
        do_not: 'Do not slap back if standing',
        call_112: true,
        steps: [
            'Stand behind the person',
            'Make fist above navel below chest',
            'Pull sharply inward and upward',
        ]
    },
    SEIZURE: {
        condition: 'Seizure',
        overlay_type: 'CLEAR_SPACE',
        body_part: 'full_body',
        severity: 3,
        cause: 'Abnormal brain activity',
        golden_time: 'Usually ends in 1-3 min',
        instruction: 'Clear space. Do not hold them down.',
        do_not: 'Do not put anything in mouth',
        call_112: false,
        steps: [
            'Clear all hard objects away',
            'Time how long seizure lasts',
            'Call 112 if over 5 minutes',
        ]
    },
    STROKE: {
        condition: 'Stroke',
        overlay_type: 'FAST_TEST',
        body_part: 'head',
        severity: 5,
        cause: 'Blood supply to brain blocked',
        golden_time: '3 hours — every minute counts',
        instruction: 'Call 112 now. Keep them still and calm.',
        do_not: 'Do not give food or water',
        call_112: true,
        steps: [
            'Check face drooping on one side',
            'Ask to raise both arms',
            'Note time symptoms started',
        ]
    },
}