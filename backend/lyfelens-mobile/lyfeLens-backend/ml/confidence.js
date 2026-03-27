// Filter out keypoints with low detection confidence
// Identical to Sahil's confidence.js, converted to CommonJS

const filterLowConfidence = (keypoints, threshold = 0.4) => {
    return keypoints.map(kp => ({
        ...kp,
        valid: kp.score > threshold
    }))
}

module.exports = { filterLowConfidence }
