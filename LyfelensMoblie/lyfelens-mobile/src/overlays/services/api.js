import { mockKeypoints, getOverlayTypeMock } from '../utils/fakeKeypoints';

const SIMULATE_NETWORK_DELAY = 600;

/**
 * Mock API service to replace actual WebSocket/HTTP boundary
 * taking camera frames and simulating backend model results
 */
export const InferenceService = {
  analyzeFrame: async (base64FrameData, scenario = 'CPR_HANDS') => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          overlayType: getOverlayTypeMock(scenario),
          keypoints: mockKeypoints,
          confidence: 0.98,
          boundingBox: { x: 0.5, y: 0.5, w: 0.4, h: 0.8 }, // Normalize 0-1
          timestamp: Date.now()
        });
      }, SIMULATE_NETWORK_DELAY);
    });
  },

  getEmergencyProtocols: async (incidentType) => {
    // Return standard text instructions
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          steps: [
            "Ensure the scene is safe",
            "Call emergency services immediately",
            "Follow on-screen visual guides"
          ],
          precautions: ["Do not move patient if spinal injury suspected", "Ensure your own safety first"],
          severity: "CRITICAL"
        });
      }, 300);
    });
  }
};
