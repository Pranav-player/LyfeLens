import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Speech from 'expo-speech';
import { useEffect, useRef, useState } from 'react';
import { Button, Dimensions, StyleSheet, View, Text } from 'react-native';
import OverlayManager from '../../src/overlays/OverlayManager'; // Import the overlay manager
import IronManHUD from '../../src/overlays/components/IronManHUD';

const MOCK_HUD_DATABASE: Record<string, any> = {
  'CARDIAC_ARREST': {
    label: 'CARDIAC ARREST / UNCONSCIOUS',
    description: 'Patient is unresponsive. Immediate chest compressions required to maintain blood flow to the brain.',
    precautions: ['Do NOT stop compressions pending AED', 'Ensure patient is on a firm, flat surface'],
    box: { x: 0.5, y: 0.42, w: 0.5, h: 0.5 }
  },
  'BLEEDING': {
    label: 'SEVERE HEMORRHAGE',
    description: 'Active severe bleeding detected at the extremity. Immediate sustained pressure required.',
    precautions: ['Do NOT remove soaked bandages, add more on top', 'Elevate the wound if possible'],
    box: { x: 0.3, y: 0.6, w: 0.3, h: 0.3 }
  },
  'FRACTURE': {
    label: 'SUSPECTED FRACTURE',
    description: 'Visible structural deformation detected. High probability of bone fracture.',
    precautions: ['Do NOT attempt to realign the bone', 'Immobilize the joint above and below the fracture'],
    box: { x: 0.5, y: 0.5, w: 0.4, h: 0.4 }
  },
  'UNCONSCIOUS_BREATHING': {
    label: 'UNCONSCIOUS & BREATHING',
    description: 'Patient is breathing but unresponsive. Clear airway must be maintained to prevent choking.',
    precautions: ['Do NOT lay patient flat on back', 'Constantly monitor breathing'],
    box: { x: 0.5, y: 0.65, w: 0.5, h: 0.6 }
  },
  'BURNS': {
    label: 'THERMAL BURN',
    description: 'Severe tissue damage from heat source detected. Cooling protocol required.',
    precautions: ['Do NOT apply ice directly', 'Do NOT pop blisters'],
    box: { x: 0.3, y: 0.6, w: 0.4, h: 0.4 }
  },
  'CHOKING': {
    label: 'AIRWAY OBSTRUCTION (CHOKING)',
    description: 'Patient unable to breathe or cough. Immediate abdominal thrusts (Heimlich) required.',
    precautions: ['Do NOT perform blind finger sweeps', 'If patient becomes unconscious, begin CPR'],
    box: { x: 0.5, y: 0.65, w: 0.4, h: 0.4 }
  },
  'SEIZURE': {
    label: 'ACTIVE SEIZURE',
    description: 'Convulsions detected. Protect patient from injury and monitor duration.',
    precautions: ['Do NOT restrain the patient', "Do NOT put anything in patient's mouth"],
    box: { x: 0.5, y: 0.65, w: 0.6, h: 0.5 }
  },
  'STROKE': {
    label: 'STROKE INDICATOR (F.A.S.T)',
    description: 'Potential facial drooping or weakness detected. Crucial neurological emergency.',
    precautions: ['Do NOT give the patient food or drink', 'Time is brain: Call 112 immediately'],
    box: { x: 0.5, y: 0.3, w: 0.3, h: 0.3 }
  },
  'DEFAULT': {
    label: 'UNKNOWN EMERGENCY',
    description: 'Abnormal scene detected. Please maintain distance and assess safety.',
    precautions: ['Assess scene safety before approaching', 'Call emergency services if unsure'],
    box: { x: 0.5, y: 0.5, w: 0.5, h: 0.5 }
  }
};

/**
 * ARScreen - Main Camera Component
 * This loops on the camera, takes low-res frames, sends them to Express,
 * and renders the SVG Medical AR instructions returned by Gemini.
 */

const { width, height } = Dimensions.get('window');

// IP address of your computer running the Node backend (e.g. 192.168.1.5:3000)
// If testing on a physical iOS/Android device, do NOT use localhost.
const BACKEND_URL = 'http://172.16.40.207:3001'; // Switched to 3001 to bypass VS Code Live Preview

export default function ARScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  // State to hold what the AI detected from the backend (Live Mode Restored!)
  const [currentOverlay, setCurrentOverlay] = useState<string | null>(null);
  const [hudData, setHudData] = useState<any>(null);
  const [keypoints, setKeypoints] = useState<any[]>([]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    // Only start polling if we have camera permission
    if (permission?.granted) {
      interval = setInterval(() => {
        analyzeCurrentFrame();
      }, 3500); // 3.5 seconds polling rate for safety
    }

    return () => clearInterval(interval);
  }, [permission]);

  const isProcessing = useRef(false);

  const analyzeCurrentFrame = async () => {
    if (!cameraRef.current || isProcessing.current) return;
    
    isProcessing.current = true;
    try {
      // 1. Take a very low quality picture for speed. We just need the macro scene.
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.1,
        scale: 0.5
      });

      if (!photo?.base64) return;

      // 2. Send it to your Node Server running the Gemini Model
      const response = await fetch(`${BACKEND_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: `live-session-${Date.now()}`, // Bypasses the backend caching bug
          imageBase64: photo.base64,
          lat: 0,
          lng: 0
        })
      });

      const data = await response.json();

      // 3. Update the UI with what the AI found!
      if (data.condition_code && data.condition_code !== 'NONE' && data.condition_code !== 'CLEAR') {
        // Only speak if the condition changes
        if (currentOverlay !== data.condition_code) {
          Speech.speak(`Detected ${data.condition_code}. Follow AR instructions.`, {
            language: 'en-IN', pitch: 0.85, rate: 0.85
          });
        }

        setCurrentOverlay(data.condition_code);
        
        // Extract rich context data for Tony Stark Iron Man HUD
        const richData = MOCK_HUD_DATABASE[data.condition_code] || MOCK_HUD_DATABASE['DEFAULT'];
        setHudData(richData);

        // Mock keypoint extraction based on body_part
        setKeypoints([
          { name: 'chest_midpoint', x: 0.5, y: 0.42 },
          { name: 'left_wrist', x: 0.3, y: 0.6 },
          { name: 'hip_midpoint', x: 0.5, y: 0.65 },
          { name: 'nose', x: 0.5, y: 0.3 }
        ]);
      } else {
        // If Gemini detects a normal scene or returns nothing, revert to scanning mode
        setCurrentOverlay(null);
        setHudData(null);
      }
    } catch (error) {
      console.log('Failed to analyze frame:', error);
    } finally {
      isProcessing.current = false;
    }
  };

  if (!permission?.granted) {
    return (
      <View style={styles.center}>
        <Button title="Allow Camera Permission" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
      />

      {/* 4. Render the Medical AR Overlays inside */}
      {currentOverlay && (
        <OverlayManager overlayType={currentOverlay} keypoints={keypoints} />
      )}

      {/* 5. Render the high-tech Tony Stark Target HUD directly over the screen */}
      <IronManHUD data={hudData} isScanning={!currentOverlay} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scanningBox: {
    position: 'absolute', top: 60, alignSelf: 'center', padding: 12,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20
  },
  scanningText: { color: 'white', fontWeight: 'bold' }
});