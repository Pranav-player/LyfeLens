// Scene classification from pose keypoints
// Adapted from Sahil's rules.js — maps to LyfeLens condition codes

const get = (kps, name) => kps.find(k => k.name === name)

// Lying detection: person must be roughly horizontal
// Standing people have nose.y << hip.y (nose near top, hips middle)
// Lying people have nose.y ≈ hip.y (both at similar vertical position)
const isLying = (kps) => {
    const head = get(kps, 'nose')
    const hipL = get(kps, 'left_hip')
    const hipR = get(kps, 'right_hip')
    const shoulderL = get(kps, 'left_shoulder')
    const shoulderR = get(kps, 'right_shoulder')
    const hip = hipL?.valid ? hipL : (hipR?.valid ? hipR : null)

    if (!head || !head.valid || !hip || !hip.valid) return false

    // Primary: nose and hip Y within 0.35 (standing = 0.4+, lying = <0.35)
    const noseHipDiff = Math.abs(head.y - hip.y)
    if (noseHipDiff > 0.35) return false

    return true
}

// Hands on own throat (both wrists near nose level)  
const isChoking = (kps) => {
    const leftHand = get(kps, 'left_wrist')
    const rightHand = get(kps, 'right_wrist')
    const nose = get(kps, 'nose')

    if (!leftHand || !rightHand || !nose) return false
    if (!leftHand.valid || !rightHand.valid || !nose.valid) return false

    // BOTH wrists must be very close to throat
    const leftNearThroat = Math.abs(leftHand.y - nose.y) < 0.08 && Math.abs(leftHand.x - nose.x) < 0.12
    const rightNearThroat = Math.abs(rightHand.y - nose.y) < 0.08 && Math.abs(rightHand.x - nose.x) < 0.12

    return leftNearThroat && rightNearThroat
}

// DISABLED: Seizure detection from single-frame pose is too unreliable.
// Seizure requires temporal analysis (multiple frames showing jerking motion).
// Vision model can still detect seizure from visual cues (foaming, rigid body).
const isSeizure = (_kps) => {
    return false  // Disabled — too many false positives from single-frame analysis
}

// Main classifier: returns condition code or null
const classifyFromPose = (kps) => {
    if (isChoking(kps)) return 'CHOKING'
    // isSeizure disabled — defer to Groq Vision for seizure detection
    if (isLying(kps)) return 'CARDIAC_ARREST'
    return null // MoveNet can't determine — defer to Groq Vision
}

module.exports = { classifyFromPose, isLying, isChoking, isSeizure }
