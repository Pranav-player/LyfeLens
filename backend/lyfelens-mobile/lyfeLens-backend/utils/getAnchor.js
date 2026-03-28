// Map a body_part string OR condition_code to the actual keypoint coordinates
// This connects Groq Vision's classification to MoveNet's real positions

const BODY_PART_TO_KEYPOINT = {
    // Body parts (from Groq Vision body_part_detected)
    chest: 'chest_midpoint',
    chest_midpoint: 'chest_midpoint',
    sternum: 'sternum',
    head: 'nose',
    face: 'nose',
    left_arm: 'left_wrist',
    right_arm: 'right_wrist',
    left_hand: 'left_wrist',
    right_hand: 'right_wrist',
    left_leg: 'left_knee',
    right_leg: 'right_knee',
    left_foot: 'left_ankle',
    right_foot: 'right_ankle',
    abdomen: 'hip_midpoint',
    torso: 'chest_midpoint',
    back: 'chest_midpoint',
    neck: 'nose',
    throat: 'nose',
    full_body: 'hip_midpoint',
    none: 'nose',

    // Condition codes (for tracking mode where activeCondition is passed)
    CARDIAC_ARREST: 'sternum',
    BLEEDING: 'left_wrist',
    BURNS: 'left_wrist',
    BURNS_FIRST_DEGREE: 'left_wrist',
    BURNS_SECOND_DEGREE: 'left_wrist',
    BURNS_THIRD_DEGREE: 'left_wrist',
    CHOKING: 'hip_midpoint',
    SEIZURE: 'nose',
    STROKE: 'nose',
    FRACTURE: 'left_elbow',
    UNCONSCIOUS_BREATHING: 'hip_midpoint',
    POISONING: 'nose',
    MINOR_CUT: 'left_wrist',
    MAJOR_CUT: 'left_wrist',
    MINOR_BLEEDING: 'left_wrist',
    SEVERE_BLEEDING: 'left_wrist',
}

// Compute derived keypoints from standard MoveNet keypoints
const computeDerived = (keypoints) => {
    const get = (name) => keypoints.find(k => k.name === name)
    const derived = []

    // chest_midpoint = midpoint of left_shoulder + right_shoulder
    const ls = get('left_shoulder')
    const rs = get('right_shoulder')
    if (ls && rs && ls.score > 0.2 && rs.score > 0.2) {
        derived.push({
            name: 'chest_midpoint',
            x: (ls.x + rs.x) / 2,
            y: (ls.y + rs.y) / 2,
            score: Math.min(ls.score, rs.score)
        })
    }

    // sternum = slightly below chest_midpoint (between shoulders and hips)
    const lh = get('left_hip')
    const rh = get('right_hip')
    if (ls && rs && (lh || rh)) {
        const hip = lh && rh ? { x: (lh.x + rh.x) / 2, y: (lh.y + rh.y) / 2 } :
                    (lh || rh)
        const chestX = (ls.x + rs.x) / 2
        const chestY = (ls.y + rs.y) / 2
        derived.push({
            name: 'sternum',
            x: chestX,
            y: chestY + (hip.y - chestY) * 0.25,  // 25% of the way from chest to hips
            score: Math.min(ls.score, rs.score) * 0.9
        })
    }

    // hip_midpoint = midpoint of left_hip + right_hip
    if (lh && rh && lh.score > 0.2 && rh.score > 0.2) {
        derived.push({
            name: 'hip_midpoint',
            x: (lh.x + rh.x) / 2,
            y: (lh.y + rh.y) / 2,
            score: Math.min(lh.score, rh.score)
        })
    }

    return derived
}

const getAnchor = (keypoints, bodyPart) => {
    // Add derived keypoints (sternum, chest_midpoint, hip_midpoint)
    const allKps = [...keypoints, ...computeDerived(keypoints)]

    const kpName = BODY_PART_TO_KEYPOINT[bodyPart] || 'chest_midpoint'

    // Try primary keypoint
    const kp = allKps.find(k => k.name === kpName && k.score > 0.2)
    if (kp) return { x: kp.x, y: kp.y }

    // Fallback cascade: sternum → chest_midpoint → nose → center
    const fallbacks = ['sternum', 'chest_midpoint', 'nose']
    for (const fb of fallbacks) {
        const fbKp = allKps.find(k => k.name === fb && k.score > 0.2)
        if (fbKp) return { x: fbKp.x, y: fbKp.y }
    }

    return { x: 0.5, y: 0.5 }
}

module.exports = { getAnchor }
