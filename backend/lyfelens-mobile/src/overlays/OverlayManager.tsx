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
    // Conditions with full 3D overlays — SVG layer is hidden, only 3D renders
    const hasFull3D = ['CARDIAC_ARREST', 'BURNS', 'BLEEDING', 'CHOKING'].includes(overlayType)

    return (
        <>
            {/* ── 3D OVERLAY (transparent canvas, pixel-perfect anchoring) ── */}
            <HoloScene3D overlayType={overlayType} keypoints={keypoints as any} />

            {/* ── SVG 2D OVERLAY for conditions without 3D yet ── */}
            {!hasFull3D && (() => {
                switch (overlayType) {
                    case 'FRACTURE':
                        return <FractureOverlay keypoint={kp(keypoints, 'left_elbow')} />

                    case 'UNCONSCIOUS_BREATHING':
                        return <RecoveryOverlay keypoint={kp(keypoints, 'hip_midpoint')} />

                    case 'SEIZURE':
                        // Use NOSE keypoint so the safety zone appears near the person's head
                        return <SeizureOverlay keypoint={kp(keypoints, 'nose', { x: 0.5, y: 0.22 })} />

                    case 'STROKE':
                        return <StrokeOverlay keypoint={kp(keypoints, 'nose', { x: 0.5, y: 0.22 })} />

                    default:
                        return null
                }
            })()}
        </>
    )
}