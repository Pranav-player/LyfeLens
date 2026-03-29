/**
 * OverlayManager — pure SVG + Reanimated overlays, zero Three.js / WebGL.
 * All animations run on the React Native UI thread, guaranteed on Android.
 * 
 * Keypoint routing: uses `injury_anchor` (from backend MoveNet body-part mapping)
 * as the PRIMARY anchor, falling back to specific keypoint names.
 * This ensures all overlays are positioned on the ACTUAL detected body part.
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
    cprBeatActive?: boolean
}

// Find keypoint by name, returns undefined if not found
const find = (keypoints: Keypoint[], name: string) =>
    (keypoints as any[]).find((k: any) => k.name === name && k.x !== undefined)

// Smart anchor: injury_anchor (from MoveNet body-part) → specific keypoint → fallback
const anchor = (keypoints: Keypoint[], specificNames: string[], fallback = { x: 0.5, y: 0.42 }) => {
    // 1. Use backend-computed injury_anchor (most accurate — maps detected body part to MoveNet)
    const injuryAnchor = find(keypoints, 'injury_anchor')
    if (injuryAnchor) return injuryAnchor

    // 2. Fall back to specific keypoint names for this overlay type
    for (const name of specificNames) {
        const kp = find(keypoints, name)
        if (kp) return kp
    }

    // 3. Last resort — screen center
    return fallback
}

export default function OverlayManager({ overlayType, keypoints, cprBeatActive }: Props) {
    switch (overlayType) {
        case 'CARDIAC_ARREST':
            return <CPROverlay keypoint={
                anchor(keypoints, ['sternum', 'chest_midpoint', 'nose'], { x: 0.5, y: 0.42 })
            } beatActive={cprBeatActive} />

        case 'BLEEDING':
        case 'MINOR_CUT':
        case 'MAJOR_CUT':
        case 'MINOR_BLEEDING':
        case 'SEVERE_BLEEDING':
            // Bleeding: injury_anchor → wrists → elbows
            return <BleedingOverlay keypoint={
                anchor(keypoints, ['left_wrist', 'right_wrist', 'left_elbow', 'right_elbow'])
            } />

        case 'BURNS':
        case 'BURNS_FIRST_DEGREE':
        case 'BURNS_SECOND_DEGREE':
        case 'BURNS_THIRD_DEGREE':
            // Burns: injury_anchor → wrists → elbows
            return <BurnsOverlay keypoint={
                anchor(keypoints, ['left_wrist', 'right_wrist', 'left_elbow', 'right_elbow'])
            } />

        case 'CHOKING':
            // Choking/Heimlich: target abdomen (between hip and chest)
            return <HeimlichOverlay keypoint={
                anchor(keypoints, ['hip_midpoint', 'left_hip', 'right_hip'], { x: 0.5, y: 0.65 })
            } />

        case 'FRACTURE':
            // Fracture: injury_anchor → elbow → knee → wrist
            return <FractureOverlay keypoint={
                anchor(keypoints, ['left_elbow', 'right_elbow', 'left_knee', 'right_knee', 'left_wrist'])
            } />

        case 'UNCONSCIOUS_BREATHING':
            // Recovery: hip area for turning position
            return <RecoveryOverlay keypoint={
                anchor(keypoints, ['hip_midpoint', 'left_hip', 'right_hip'])
            } />

        case 'SEIZURE':
        case 'POISONING':
            // Seizure/Poison: head area for safety monitoring
            return <SeizureOverlay keypoint={
                anchor(keypoints, ['nose', 'left_eye', 'right_eye'], { x: 0.5, y: 0.22 })
            } />

        case 'STROKE':
            // Stroke: face for FAST assessment
            return <StrokeOverlay keypoint={
                anchor(keypoints, ['nose', 'left_eye', 'right_eye'], { x: 0.5, y: 0.22 })
            } />

        default:
            return null
    }
}