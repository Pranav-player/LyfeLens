import CPROverlay from './CPROverlay'
import BleedingOverlay from './BleedingOverlay'
import FractureOverlay from './FractureOverlay'
import RecoveryOverlay from './RecoveryOverlays'
import BurnsOverlay from './BurnsOverlay'
import HeimlichOverlay from './HeimlichOverlay'
import SeizureOverlay from './SeizureOverlay'
import StrokeOverlay from './strokeOverlay'
import HoloScene3D from './3d/HoloScene3D'

type Keypoint = { name?: string; x: number; y: number }

type Props = {
    overlayType: string
    keypoints: Keypoint[]
}

// Helper — find keypoint by name with fallback
const kp = (keypoints: Keypoint[], name: string, fallback = { x: 0.5, y: 0.42 }) =>
    (keypoints as any[]).find((k: any) => k.name === name) || fallback

export default function OverlayManager({ overlayType, keypoints }: Props) {
    // Always try 3D first AND show SVG overlays as backup
    // If 3D Canvas works, the SVG sits underneath (still visible around edges)
    // If 3D Canvas crashes (Android), the SVG provides the full AR experience

    const renderSVG = () => {
        switch (overlayType) {
            case 'CARDIAC_ARREST':
                return <CPROverlay keypoint={kp(keypoints, 'chest_midpoint')} />

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

    return (
        <>
            {/* SVG 2D Overlay (always rendered — guaranteed to work on Android) */}
            {renderSVG()}

            {/* 3D Overlay on top (has error boundary — if GL fails, it returns null) */}
            <HoloScene3D overlayType={overlayType} keypoints={keypoints as any} />
        </>
    )
}