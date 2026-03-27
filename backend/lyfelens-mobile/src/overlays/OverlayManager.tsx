import CPROverlay from './CPROverlay'
import BleedingOverlay from './BleedingOverlay'
import FractureOverlay from './FractureOverlay'
import RecoveryOverlay from './RecoveryOverlays'
import BurnsOverlay from './BurnsOverlay'
import HeimlichOverlay from './HeimlichOverlay'
import SeizureOverlay from './SeizureOverlay'
import StrokeOverlay from './strokeOverlay'

type Keypoint = { x: number, y: number }

type Props = {
    overlayType: string
    keypoints: Keypoint[]  // full keypoint array from ML
}

// Helper — find keypoint by name with fallback
const kp = (keypoints: Keypoint[], name: string) =>
    (keypoints as any[]).find((k: any) => k.name === name) || { x: 0.5, y: 0.42 }

export default function OverlayManager({ overlayType, keypoints }: Props) {
    switch (overlayType) {
        case 'CPR_HANDS':
            return <CPROverlay keypoint={kp(keypoints, 'chest_midpoint')} />

        case 'PRESSURE_ARROW':
            // Use whichever arm/leg has the wound — backend tells you body_part
            return <BleedingOverlay keypoint={kp(keypoints, 'left_wrist')} />

        case 'RED_X':
            return <FractureOverlay keypoint={kp(keypoints, 'left_elbow')} />

        case 'RECOVERY_POSITION':
            return <RecoveryOverlay keypoint={kp(keypoints, 'hip_midpoint')} />

        case 'COOL_WATER':
            return <BurnsOverlay keypoint={kp(keypoints, 'left_wrist')} />

        case 'HEIMLICH_GUIDE':
            return <HeimlichOverlay keypoint={kp(keypoints, 'hip_midpoint')} />

        case 'CLEAR_SPACE':
            return <SeizureOverlay keypoint={kp(keypoints, 'hip_midpoint')} />

        case 'FAST_TEST':
            return <StrokeOverlay keypoint={kp(keypoints, 'nose')} />

        default:
            return <CPROverlay keypoint={kp(keypoints, 'chest_midpoint')} />
    }
}

/*
## Summary Of What Changed
```
CPR        → hands physically push down, shadow squishes, 100 BPM ✅
Bleeding   → wound circle + tourniquet guide line + animated pressure hand
Fracture   → flashing warning + jagged bone indicator + hold-still arrows
Choking    → fists animate inward thrust + upward arrow + exact position
Seizure    → real seizure timer counting up + call 112 after 5 minutes
Stroke     → full FAST test on face + flashing 112 button
Burns      → flowing water animation downward + 10 min no ice reminder
Recovery   → body rocks in rolling direction + 3 numbered steps shown*/