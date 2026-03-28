import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { Button, Dimensions, StyleSheet, View, Text } from 'react-native';
import OverlayManager from '../../src/overlays/OverlayManager';
import IronManHUD from '../../src/overlays/components/IronManHUD';
import EmergencyCallBar from '../../src/overlays/components/EmergencyCallBar';
import { startVoiceGuide, stopVoiceGuide, getStepText, getTotalSteps } from '../../src/overlays/services/voiceGuide';

// Human-readable labels for the HUD
const HUD_DATABASE: Record<string, any> = {
  'CARDIAC_ARREST': {
    label: 'CARDIAC ARREST',
    description: 'Person is unresponsive. Start chest compressions immediately.',
    precautions: ['Do NOT stop compressions', 'Push on firm flat surface'],
  },
  'BLEEDING': {
    label: 'SEVERE BLEEDING',
    description: 'Active bleeding detected. Press hard on the wound NOW.',
    precautions: ['Do NOT remove soaked cloth — add more', 'Elevate the wound'],
  },
  'FRACTURE': {
    label: 'SUSPECTED FRACTURE',
    description: 'Possible broken bone. Do not move the injured area.',
    precautions: ['Do NOT realign the bone', 'Immobilize above and below'],
  },
  'UNCONSCIOUS_BREATHING': {
    label: 'UNCONSCIOUS — BREATHING',
    description: 'Person is breathing but unconscious. Put them in recovery position.',
    precautions: ['Do NOT lay flat on back', 'Monitor breathing constantly'],
  },
  'BURNS': {
    label: 'BURN INJURY',
    description: 'Burn detected. Run cool water for 10 minutes.',
    precautions: ['NO ice', 'NO butter or toothpaste', 'Do NOT pop blisters'],
  },
  'CHOKING': {
    label: 'CHOKING — AIRWAY BLOCKED',
    description: 'Person cannot breathe. Perform Heimlich maneuver now.',
    precautions: ['Do NOT do blind finger sweeps', 'If unconscious, start CPR'],
  },
  'SEIZURE': {
    label: 'ACTIVE SEIZURE',
    description: 'Seizure in progress. Clear area. Do NOT hold them down.',
    precautions: ['Do NOT restrain', 'Do NOT put anything in mouth'],
  },
  'STROKE': {
    label: 'POSSIBLE STROKE — F.A.S.T',
    description: 'Facial drooping or weakness detected. Call 112 NOW.',
    precautions: ['Do NOT give food or water', 'Note the time it started'],
  },
};

const { width, height } = Dimensions.get('window');
const BACKEND_URL = 'http://172.16.40.207:8080';

export default function ARScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [currentOverlay, setCurrentOverlay] = useState<string | null>(null);
  const [hudData, setHudData] = useState<any>(null);
  const [keypoints, setKeypoints] = useState<any[]>([]);
  const [overlayAnchor, setOverlayAnchor] = useState<{ x: number; y: number } | null>(null);
  const [detectionSource, setDetectionSource] = useState<string>('');
  const [voiceStep, setVoiceStep] = useState(0);
  const [voiceTotal, setVoiceTotal] = useState(0);

  const isProcessing = useRef(false);
  const lastCondition = useRef<string | null>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (permission?.granted) {
      interval = setInterval(() => {
        analyzeCurrentFrame();
      }, 3500);
    }

    return () => {
      clearInterval(interval);
      stopVoiceGuide();
    };
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
        const condition = data.condition_code;
        
        // Start voice guide when condition CHANGES
        if (lastCondition.current !== condition) {
          lastCondition.current = condition;
          startVoiceGuide(condition, (step, total) => {
            setVoiceStep(step);
            setVoiceTotal(total);
          });
        }

        setCurrentOverlay(condition);
        setDetectionSource(data.source || 'unknown');

        // Use real keypoints from MoveNet
        if (data.keypoints && data.keypoints.length > 0) {
          setKeypoints(data.keypoints);
        } else {
          setKeypoints([
            { name: 'chest_midpoint', x: 0.5, y: 0.42 },
            { name: 'left_wrist', x: 0.35, y: 0.55 },
            { name: 'hip_midpoint', x: 0.5, y: 0.65 },
            { name: 'nose', x: 0.5, y: 0.25 }
          ]);
        }

        if (data.overlay_anchor) {
          setOverlayAnchor(data.overlay_anchor);
        }

        const richData = HUD_DATABASE[condition] || HUD_DATABASE['CARDIAC_ARREST'];
        const anchor = data.overlay_anchor || { x: 0.5, y: 0.5 };
        setHudData({
          ...richData,
          box: { x: anchor.x, y: anchor.y, w: 0.4, h: 0.4 }
        });

      } else {
        // Normal scene — scanning
        if (lastCondition.current !== null) {
          lastCondition.current = null;
          stopVoiceGuide();
          setVoiceStep(0);
          setVoiceTotal(0);
        }
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

      {/* Medical AR Overlays — body-anchored */}
      {currentOverlay && (
        <OverlayManager overlayType={currentOverlay} keypoints={keypoints} />
      )}

      {/* Iron Man HUD */}
      <IronManHUD data={hudData} isScanning={!currentOverlay} />

      {/* Emergency Call Bar + Step-by-step instructions */}
      {currentOverlay && (
        <EmergencyCallBar
          condition={currentOverlay}
          currentStep={voiceStep}
          totalSteps={voiceTotal || getTotalSteps(currentOverlay)}
          stepText={getStepText(currentOverlay, voiceStep)}
        />
      )}

      {/* Detection source badge */}
      {detectionSource ? (
        <View style={styles.sourceTag}>
          <Text style={styles.sourceText}>
            {detectionSource === 'movenet' ? '⚡ ML POSE' : 
             detectionSource === 'groq' || detectionSource === 'gemini' ? '🧠 AI VISION' : 
             '🔍 ANALYZING'}
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
    top: 55,
    right: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 255, 0.3)',
  },
  sourceText: {
    color: '#00FFCC',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  }
});