// Scene classification from pose keypoints
// Adapted from Sahil's rules.js — maps to LyfeLens condition codes

const get = (kps, name) => kps.find(k => k.name === name)

// STRICT lying detection: person must be truly horizontal
// Standing people have nose.y << hip.y (nose near top of frame)
// Lying people have nose.y ≈ hip.y AND both shoulders at similar Y
const isLying = (kps) => {
    const head = get(kps, 'nose')
    const hipL = get(kps, 'left_hip')
    const hipR = get(kps, 'right_hip')
    const shoulderL = get(kps, 'left_shoulder')
    const shoulderR = get(kps, 'right_shoulder')
    const hip = hipL?.valid ? hipL : (hipR?.valid ? hipR : null)

    if (!head || !head.valid || !hip || !hip.valid) return false

    // Primary check: nose and hip at similar Y (truly horizontal)
    // 0.15 is strict — standing people have ~0.4+ difference
    const noseHipDiff = Math.abs(head.y - hip.y)
    if (noseHipDiff > 0.15) return false

    // Secondary check: shoulders roughly level (not one above the other like sitting)
    if (shoulderL?.valid && shoulderR?.valid) {
        const shoulderDiff = Math.abs(shoulderL.y - shoulderR.y)
        if (shoulderDiff > 0.12) return false // Shoulders should be roughly level when lying
    }

    // Tertiary check: nose should NOT be at the very top of frame (standing person)
    // Lying person's nose is typically at y > 0.25
    if (head.y < 0.15) return false

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
