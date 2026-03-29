// Temporal smoothing to prevent jittery overlays
// Identical to Sahil's smoother.js, converted to CommonJS

let prev = null

const smooth = (current) => {
    if (!prev) {
        prev = current
        return current
    }

    const alpha = 0.6 // smoothing factor (higher = more responsive, lower = smoother)

    const smoothed = current.map((kp, i) => ({
        ...kp,
        x: alpha * kp.x + (1 - alpha) * (prev[i]?.x || kp.x),
        y: alpha * kp.y + (1 - alpha) * (prev[i]?.y || kp.y)
    }))

    prev = smoothed
    return smoothed
}

const resetSmoother = () => {
    prev = null
}

module.exports = { smooth, resetSmoother }
