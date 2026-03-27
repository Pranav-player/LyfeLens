// Scene classification from pose keypoints
// Adapted from Sahil's rules.js — maps to LyfeLens condition codes

const get = (kps, name) => kps.find(k => k.name === name)

// Person lying flat (head and hips at same Y level)
const isLying = (kps) => {
    const head = get(kps, 'nose')
    const hip = get(kps, 'left_hip')

    if (!head || !hip || !head.valid || !hip.valid) return false
    return Math.abs(head.y - hip.y) < 0.08
}

// Hands on own throat (both wrists near nose level)
const isChoking = (kps) => {
    const leftHand = get(kps, 'left_wrist')
    const rightHand = get(kps, 'right_wrist')
    const nose = get(kps, 'nose')

    if (!leftHand || !rightHand || !nose) return false
    if (!leftHand.valid || !rightHand.valid || !nose.valid) return false

    const leftNearThroat = Math.abs(leftHand.y - nose.y) < 0.12 && Math.abs(leftHand.x - nose.x) < 0.15
    const rightNearThroat = Math.abs(rightHand.y - nose.y) < 0.12 && Math.abs(rightHand.x - nose.x) < 0.15

    return leftNearThroat && rightNearThroat
}

// Rapid limb movement detected via high variance in positions
// Note: In server-side mode, we approximate this by checking if limbs are
// in unusual asymmetric positions while lying down
const isSeizure = (kps) => {
    const isDown = isLying(kps)
    if (!isDown) return false

    const leftWrist = get(kps, 'left_wrist')
    const rightWrist = get(kps, 'right_wrist')
    const leftAnkle = get(kps, 'left_ankle')
    const rightAnkle = get(kps, 'right_ankle')

    if (!leftWrist || !rightWrist) return false

    // If limbs are spread asymmetrically while lying → possible seizure
    const armSpread = Math.abs(leftWrist.y - rightWrist.y) > 0.15
    const legSpread = leftAnkle && rightAnkle ? Math.abs(leftAnkle.y - rightAnkle.y) > 0.15 : false

    return armSpread || legSpread
}

// Main classifier: returns condition code or null
const classifyFromPose = (kps) => {
    if (isChoking(kps)) return 'CHOKING'
    if (isSeizure(kps)) return 'SEIZURE'
    if (isLying(kps)) return 'CARDIAC_ARREST' // Could be unconscious — Gemini refines
    return null // MoveNet can't determine — defer to Gemini
}

module.exports = { classifyFromPose, isLying, isChoking, isSeizure }
