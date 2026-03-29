// MoveNet pose detector for Node.js
// Uses pure JS @tensorflow/tfjs backend (works on all Node.js versions)

const tf = require('@tensorflow/tfjs')
const poseDetection = require('@tensorflow-models/pose-detection')
const jpeg = require('jpeg-js')

let detector = null

const initMoveNet = async () => {
    if (detector) return detector

    // Force CPU backend for pure JS mode
    await tf.setBackend('cpu')
    await tf.ready()

    console.log('[MoveNet] TF backend:', tf.getBackend())
    console.log('[MoveNet] Initializing pose detector...')

    detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
    )
    console.log('[MoveNet] Detector ready (SinglePose Lightning)')
    return detector
}

const getKeypoints = async (imageBase64) => {
    const det = await initMoveNet()

    // Decode base64 → JPEG → raw pixel data → TF tensor
    const buffer = Buffer.from(imageBase64, 'base64')
    
    let rawImageData
    try {
        rawImageData = jpeg.decode(buffer, { useTArray: true })
    } catch (err) {
        // If the image is PNG or corrupt, skip
        console.log('[MoveNet] Image decode failed, skipping frame')
        return null
    }

    const { width, height, data } = rawImageData

    // jpeg-js returns RGBA (4 channels), we need RGB (3 channels)
    const numPixels = width * height
    const rgbData = new Uint8Array(numPixels * 3)
    for (let i = 0; i < numPixels; i++) {
        rgbData[i * 3] = data[i * 4]       // R
        rgbData[i * 3 + 1] = data[i * 4 + 1] // G
        rgbData[i * 3 + 2] = data[i * 4 + 2] // B
    }

    const tensor = tf.tensor3d(rgbData, [height, width, 3], 'int32')
    const poses = await det.estimatePoses(tensor)
    tensor.dispose()

    if (!poses || poses.length === 0) return null

    // Attach image dimensions for normalization
    const keypoints = poses[0].keypoints.map(kp => ({
        ...kp,
        _imgWidth: width,
        _imgHeight: height
    }))

    return keypoints
}

module.exports = { initMoveNet, getKeypoints }
