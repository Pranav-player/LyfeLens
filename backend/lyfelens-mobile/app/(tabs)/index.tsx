import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Speech from 'expo-speech';
import { useEffect, useRef, useState } from 'react';
import { Button, Dimensions, StyleSheet, View, Text } from 'react-native';
import OverlayManager from '../../src/overlays/OverlayManager';
import IronManHUD from '../../src/overlays/components/IronManHUD';

const MOCK_HUD_DATABASE: Record<string, any> = {
  'CARDIAC_ARREST': {
    label: 'CARDIAC ARREST / UNCONSCIOUS',
    description: 'Patient is unresponsive. Immediate chest compressions required to maintain blood flow to the brain.',
    precautions: ['Do NOT stop compressions pending AED', 'Ensure patient is on a firm, flat surface'],
  },
  'BLEEDING': {
    label: 'SEVERE HEMORRHAGE',
    description: 'Active severe bleeding detected at the extremity. Immediate sustained pressure required.',
    precautions: ['Do NOT remove soaked bandages, add more on top', 'Elevate the wound if possible'],
  },
  'FRACTURE': {
    label: 'SUSPECTED FRACTURE',
    description: 'Visible structural deformation detected. High probability of bone fracture.',
    precautions: ['Do NOT attempt to realign the bone', 'Immobilize the joint above and below the fracture'],
  },
  'UNCONSCIOUS_BREATHING': {
    label: 'UNCONSCIOUS & BREATHING',
    description: 'Patient is breathing but unresponsive. Clear airway must be maintained to prevent choking.',
    precautions: ['Do NOT lay patient flat on back', 'Constantly monitor breathing'],
  },
  'BURNS': {
    label: 'THERMAL BURN',
    description: 'Severe tissue damage from heat source detected. Cooling protocol required.',
    precautions: ['Do NOT apply ice directly', 'Do NOT pop blisters'],
  },
  'CHOKING': {
    label: 'AIRWAY OBSTRUCTION (CHOKING)',
    description: 'Patient unable to breathe or cough. Immediate abdominal thrusts (Heimlich) required.',
    precautions: ['Do NOT perform blind finger sweeps', 'If patient becomes unconscious, begin CPR'],
  },
  'SEIZURE': {
    label: 'ACTIVE SEIZURE',
    description: 'Convulsions detected. Protect patient from injury and monitor duration.',
    precautions: ['Do NOT restrain the patient', "Do NOT put anything in patient's mouth"],
  },
  'STROKE': {
    label: 'STROKE INDICATOR (F.A.S.T)',
    description: 'Potential facial drooping or weakness detected. Crucial neurological emergency.',
    precautions: ['Do NOT give the patient food or drink', 'Time is brain: Call 112 immediately'],
  },
  'DEFAULT': {
    label: 'UNKNOWN EMERGENCY',
    description: 'Abnormal scene detected. Please maintain distance and assess safety.',
    precautions: ['Assess scene safety before approaching', 'Call emergency services if unsure'],
  }
};

const { width, height } = Dimensions.get('window');

// IP address of your computer running the Node backend
const BACKEND_URL = 'http://172.16.40.207:8080';

export default function ARScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [currentOverlay, setCurrentOverlay] = useState<string | null>(null);
  const [hudData, setHudData] = useState<any>(null);
  const [keypoints, setKeypoints] = useState<any[]>([]);
  const [overlayAnchor, setOverlayAnchor] = useState<{ x: number; y: number } | null>(null);
  const [detectionSource, setDetectionSource] = useState<string>('');

  const isProcessing = useRef(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (permission?.granted) {
      interval = setInterval(() => {
        analyzeCurrentFrame();
      }, 3500);
    }

    return () => clearInterval(interval);
  }, [permission]);

  const analyzeCurrentFrame = async () => {
    if (!cameraRef.current || isProcessing.current) return;

    isProcessing.current = true;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.1,
        scale: 0.5
      });

      if (!photo?.base64) return;

      const response = await fetch(`${BACKEND_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: `live-session-${Date.now()}`,
          imageBase64: photo.base64,
          lat: 0,
          lng: 0
        })
      });

      const data = await response.json();

      if (data.condition_code && data.condition_code !== 'NONE' && data.condition_code !== 'CLEAR') {
        // Only speak if the condition changes
        if (currentOverlay !== data.condition_code) {
          const richData = MOCK_HUD_DATABASE[data.condition_code] || MOCK_HUD_DATABASE['DEFAULT'];
          Speech.speak(`Detected ${richData.label}. Follow AR instructions.`, {
            language: 'en-IN', pitch: 0.85, rate: 0.85
          });
        }

        setCurrentOverlay(data.condition_code);
        setDetectionSource(data.source || 'unknown');

        // Use REAL keypoints from MoveNet (not hardcoded!)
        if (data.keypoints && data.keypoints.length > 0) {
          setKeypoints(data.keypoints);
        } else {
          // Fallback to reasonable defaults if MoveNet didn't detect a person
          setKeypoints([
            { name: 'chest_midpoint', x: 0.5, y: 0.42 },
            { name: 'left_wrist', x: 0.3, y: 0.6 },
            { name: 'hip_midpoint', x: 0.5, y: 0.65 },
            { name: 'nose', x: 0.5, y: 0.3 }
          ]);
        }

        // Use real overlay anchor from backend
        if (data.overlay_anchor) {
          setOverlayAnchor(data.overlay_anchor);
        }

        // Build HUD data with real anchor position
        const richData = MOCK_HUD_DATABASE[data.condition_code] || MOCK_HUD_DATABASE['DEFAULT'];
        const anchor = data.overlay_anchor || { x: 0.5, y: 0.5 };
        setHudData({
          ...richData,
          box: { x: anchor.x, y: anchor.y, w: 0.4, h: 0.4 }
        });

      } else {
        // Normal scene — revert to scanning
        setCurrentOverlay(null);
        setHudData(null);
        setOverlayAnchor(null);
        setDetectionSource('');
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

      {/* Medical AR Overlays — now using REAL keypoints */}
      {currentOverlay && (
        <OverlayManager overlayType={currentOverlay} keypoints={keypoints} />
      )}

      {/* Iron Man HUD — now with real anchor positions */}
      <IronManHUD data={hudData} isScanning={!currentOverlay} />

      {/* Detection source indicator */}
      {detectionSource ? (
        <View style={styles.sourceTag}>
          <Text style={styles.sourceText}>
            {detectionSource === 'movenet' ? '⚡ ML POSE' : '🧠 GEMINI AI'}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sourceTag: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 255, 0.4)',
  },
  sourceText: {
    color: '#00FFCC',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    letterSpacing: 1,
  }
});