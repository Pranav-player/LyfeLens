// Normalize raw MoveNet keypoints to 0-1 range
// Identical to Sahil's formatter.js, converted to CommonJS

const normalizeKeypoints = (keypoints, width, height) => {
    return keypoints.map(kp => ({
        name: kp.name,
        x: kp.x / width,
        y: kp.y / height,
        score: kp.score
    }))
}

module.exports = { normalizeKeypoints }
