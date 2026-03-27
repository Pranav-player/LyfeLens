export const mockKeypoints = [
  { name: 'nose', x: 0.5, y: 0.2 },
  { name: 'left_eye', x: 0.53, y: 0.18 },
  { name: 'right_eye', x: 0.47, y: 0.18 },
  { name: 'left_ear', x: 0.58, y: 0.2 },
  { name: 'right_ear', x: 0.42, y: 0.2 },
  { name: 'left_shoulder', x: 0.65, y: 0.35 },
  { name: 'right_shoulder', x: 0.35, y: 0.35 },
  { name: 'left_elbow', x: 0.7, y: 0.5 },
  { name: 'right_elbow', x: 0.3, y: 0.5 },
  { name: 'left_wrist', x: 0.75, y: 0.65 },
  { name: 'right_wrist', x: 0.25, y: 0.65 },
  { name: 'left_hip', x: 0.6, y: 0.6 },
  { name: 'right_hip', x: 0.4, y: 0.6 },
  { name: 'left_knee', x: 0.65, y: 0.8 },
  { name: 'right_knee', x: 0.35, y: 0.8 },
  { name: 'left_ankle', x: 0.68, y: 0.95 },
  { name: 'right_ankle', x: 0.32, y: 0.95 },
  
  // Custom synthetic keypoints added by backend processing
  { name: 'chest_midpoint', x: 0.5, y: 0.42 },
  { name: 'hip_midpoint', x: 0.5, y: 0.6 },
];

export function getOverlayTypeMock(scenario) {
  const scenarios = [
    'CPR_HANDS', 
    'PRESSURE_ARROW', 
    'RED_X', 
    'RECOVERY_POSITION', 
    'COOL_WATER', 
    'HEIMLICH_GUIDE',
    'CLEAR_SPACE',
    'FAST_TEST'
  ];
  return scenarios.includes(scenario) ? scenario : 'CPR_HANDS';
}
