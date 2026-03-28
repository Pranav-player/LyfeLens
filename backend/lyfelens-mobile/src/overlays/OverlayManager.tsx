/**
 * OverlayManager — pure SVG + Reanimated overlays, zero Three.js / WebGL.
 * All animations run on the React Native UI thread, guaranteed on Android.
 */
import CPROverlay from './CPROverlay'
import BleedingOverlay from './BleedingOverlay'
import FractureOverlay from './FractureOverlay'
import RecoveryOverlay from './RecoveryOverlays'
import BurnsOverlay from './BurnsOverlay'
import HeimlichOverlay from './HeimlichOverlay'
import SeizureOverlay from './SeizureOverlay'
import StrokeOverlay from './strokeOverlay'

type Keypoint = { name?: string; x: number; y: number }

type Props = {
    overlayType: string
    keypoints: Keypoint[]
}

// Helper — find keypoint by name with fallback
const kp = (keypoints: Keypoint[], name: string, fallback = { x: 0.5, y: 0.42 }) =>
    (keypoints as any[]).find((k: any) => k.name === name) || fallback

export default function OverlayManager({ overlayType, keypoints }: Props) {
    switch (overlayType) {
        case 'CARDIAC_ARREST':
            // Try sternum → chest_midpoint → nose → center (same cascade as before)
            return <CPROverlay keypoint={
                kp(keypoints, 'sternum') ||
                kp(keypoints, 'chest_midpoint') ||
                kp(keypoints, 'nose') ||
                { x: 0.5, y: 0.42 }
            } />

        case 'BLEEDING':
        case 'MINOR_CUT':
        case 'MAJOR_CUT':
        case 'MINOR_BLEEDING':
        case 'SEVERE_BLEEDING':
            return <BleedingOverlay keypoint={kp(keypoints, 'left_wrist')} />

        case 'BURNS':
        case 'BURNS_FIRST_DEGREE':
        case 'BURNS_SECOND_DEGREE':
        case 'BURNS_THIRD_DEGREE':
            return <BurnsOverlay keypoint={kp(keypoints, 'left_wrist')} />

        case 'CHOKING':
            return <HeimlichOverlay keypoint={kp(keypoints, 'hip_midpoint', { x: 0.5, y: 0.65 })} />

        case 'FRACTURE':
            return <FractureOverlay keypoint={kp(keypoints, 'left_elbow')} />

        case 'UNCONSCIOUS_BREATHING':
            return <RecoveryOverlay keypoint={kp(keypoints, 'hip_midpoint')} />

        case 'SEIZURE':
        case 'POISONING':
            return <SeizureOverlay keypoint={kp(keypoints, 'nose', { x: 0.5, y: 0.22 })} />

        case 'STROKE':
            return <StrokeOverlay keypoint={kp(keypoints, 'nose', { x: 0.5, y: 0.22 })} />

        default:
            return null
    }
}