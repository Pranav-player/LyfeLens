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

    // Chest midpoint (average of both shoulders)
    if (leftShoulder && rightShoulder) {
        kps.push({
            name: 'chest_midpoint',
            x: (leftShoulder.x + rightShoulder.x) / 2,
            y: (leftShoulder.y + rightShoulder.y) / 2,
            score: Math.min(leftShoulder.score, rightShoulder.score),
            valid: leftShoulder.valid && rightShoulder.valid
        })
    }

    // Hip midpoint (average of both hips)
    if (leftHip && rightHip) {
        kps.push({
            name: 'hip_midpoint',
            x: (leftHip.x + rightHip.x) / 2,
            y: (leftHip.y + rightHip.y) / 2,
            score: Math.min(leftHip.score, rightHip.score),
            valid: leftHip.valid && rightHip.valid
        })
    }

    return kps
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
        const withSynthetic = addSyntheticKeypoints(smoothed)

        const scene = classifyFromPose(smoothed)

        return {
            scene,       // 'CHOKING', 'SEIZURE', 'CARDIAC_ARREST', or null
            keypoints: withSynthetic,  // All 17 MoveNet + 2 synthetic keypoints
            hasPerson: true
        }
    } catch (err) {
        console.log('[MoveNet Pipeline] Error:', err.message)
        return { scene: null, keypoints: [], hasPerson: false }
    }
}

module.exports = { processFrame, initMoveNet }
