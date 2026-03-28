// Main ML pipeline entry point
// Adapted from Sahil's pipeline.js for Node.js server-side execution
// Flow: base64 image → MoveNet → normalize → filter → smooth → classify

const { getKeypoints, initMoveNet } = require('./movenet')
const { normalizeKeypoints } = require('./formatter')
const { smooth } = require('./smoother')
const { filterLowConfidence } = require('./confidence')
const { classifyFromPose } = require('./classifier')

// Synthetic keypoints computed from the real 17 MoveNet points
const addSyntheticKeypoints = (kps) => {
    const get = (name) => kps.find(k => k.name === name)

    const leftShoulder = get('left_shoulder')
    const rightShoulder = get('right_shoulder')
    const leftHip = get('left_hip')
    const rightHip = get('right_hip')

    // Chest midpoint
    let shoulderMidY = 0;
    if (leftShoulder && rightShoulder) {
        shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
        kps.push({
            name: 'chest_midpoint',
            x: (leftShoulder.x + rightShoulder.x) / 2,
            y: shoulderMidY,
            score: Math.min(leftShoulder.score, rightShoulder.score),
            valid: leftShoulder.valid && rightShoulder.valid
        })
    }

    // Hip midpoint
    let hipMidY = 0;
    if (leftHip && rightHip) {
        hipMidY = (leftHip.y + rightHip.y) / 2;
        kps.push({
            name: 'hip_midpoint',
            x: (leftHip.x + rightHip.x) / 2,
            y: hipMidY,
            score: Math.min(leftHip.score, rightHip.score),
            valid: leftHip.valid && rightHip.valid
        })
    }

    // NEW CPR COACH LOGIC: Exact Sternum Calculation
    if (leftShoulder && rightShoulder && leftHip && rightHip) {
        kps.push({
            name: 'sternum',
            x: (leftShoulder.x + rightShoulder.x) / 2,
            y: shoulderMidY + 0.25 * (hipMidY - shoulderMidY),
            score: Math.min(leftShoulder.score, rightShoulder.score, leftHip.score, rightHip.score),
            valid: true
        })
    }

    // Rescuer Arm Angle (Calculate Angle: Shoulder -> Elbow -> Wrist)
    let armsBent = false;
    let armAngle = 180;
    const wr = get('right_wrist');
    const el = get('right_elbow');
    const sh = get('right_shoulder');
    
    if (wr && el && sh && wr.valid && el.valid && sh.valid) {
        // Dot product to get angle
        const A = Math.sqrt(Math.pow(wr.x - el.x, 2) + Math.pow(wr.y - el.y, 2));
        const B = Math.sqrt(Math.pow(el.x - sh.x, 2) + Math.pow(el.y - sh.y, 2));
        const C = Math.sqrt(Math.pow(wr.x - sh.x, 2) + Math.pow(wr.y - sh.y, 2));
        
        if (A > 0 && B > 0) {
            armAngle = Math.acos((A * A + B * B - C * C) / (2 * A * B)) * (180 / Math.PI);
            // Flag bent arms if angle is < 155 (giving 5 degrees leniency from 160)
            if (armAngle < 155) armsBent = true;
        }
    }

    return { kps, armsBent }
}

const processFrame = async (imageBase64) => {
    try {
        const raw = await getKeypoints(imageBase64)

        if (!raw) {
            return { scene: null, keypoints: [], hasPerson: false }
        }

        // Get actual image dimensions from the keypoints metadata
        const imgWidth = raw[0]?._imgWidth || 192
        const imgHeight = raw[0]?._imgHeight || 192

        // Strip internal metadata before normalizing
        const cleanRaw = raw.map(({ _imgWidth, _imgHeight, ...kp }) => kp)

        const normalized = normalizeKeypoints(cleanRaw, imgWidth, imgHeight)
        const filtered = filterLowConfidence(normalized)
        const smoothed = smooth(filtered)
        const { kps: withSynthetic, armsBent } = addSyntheticKeypoints(smoothed)

        const scene = classifyFromPose(smoothed)

        return {
            scene,       // 'CHOKING', 'SEIZURE', 'CARDIAC_ARREST', or null
            keypoints: withSynthetic,  // All 17 MoveNet + 3 synthetic keypoints (including sternum)
            hasPerson: true,
            rescuerArmsBent: armsBent
        }
    } catch (err) {
        console.log('[MoveNet Pipeline] Error:', err.message)
        return { scene: null, keypoints: [], hasPerson: false }
    }
}

module.exports = { processFrame, initMoveNet }
