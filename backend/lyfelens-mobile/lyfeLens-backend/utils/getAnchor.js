// Map a body_part string to the actual keypoint coordinates
// This connects Gemini's classification to MoveNet's real positions

const BODY_PART_TO_KEYPOINT = {
    chest: 'chest_midpoint',
    chest_midpoint: 'chest_midpoint',
    head: 'nose',
    left_arm: 'left_wrist',
    right_arm: 'right_wrist',
    left_leg: 'left_knee',
    right_leg: 'right_knee',
    full_body: 'hip_midpoint',
    none: 'nose'
}

const getAnchor = (keypoints, bodyPart) => {
    const kpName = BODY_PART_TO_KEYPOINT[bodyPart] || 'chest_midpoint'
    const kp = keypoints.find(k => k.name === kpName)
    return kp ? { x: kp.x, y: kp.y } : { x: 0.5, y: 0.5 }
}

module.exports = { getAnchor }
