import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { Button, Dimensions, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import OverlayManager from '../../src/overlays/OverlayManager';
import HoloGuideUI from '../../src/overlays/components/HoloGuideUI';
import { initDynamicVoiceGuide, stopVoiceGuide, nextStep, prevStep, repeatStep } from '../../src/overlays/services/voiceGuide';
import { getMedicalInstructionsFromGroq } from '../../src/overlays/services/groqService';

import * as Speech from 'expo-speech';

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
  'BURNS_FIRST_DEGREE': {
    label: '1ST DEGREE BURN',
    description: 'Superficial burn — redness only, no blisters.',
    precautions: ['Cool running water for 10-20 min', 'NO ice', 'Aloe vera helps'],
  },
  'BURNS_SECOND_DEGREE': {
    label: '2ND DEGREE BURN',
    description: 'Blisters present. Partial skin damage detected.',
    precautions: ['Cool water 20 min', 'Do NOT pop blisters', 'Cover with cling film'],
  },
  'BURNS_THIRD_DEGREE': {
    label: '3RD DEGREE BURN — CRITICAL',
    description: 'Full thickness burn. Call emergency services NOW.',
    precautions: ['Call 112 NOW', 'Do NOT run water on it', 'Cover with clean dry cloth'],
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
  'MINOR_CUT': {
    label: 'MINOR CUT',
    description: 'Superficial skin break detected. Clean to prevent infection.',
    precautions: ['Wash hands first', 'Apply clean sterile bandage'],
  },
  'MAJOR_CUT': {
    label: 'MAJOR CUT',
    description: 'Deep laceration detected. Stitches may be required.',
    precautions: ['Do NOT wash', 'Apply direct pressure immediately'],
  },
  'MINOR_BLEEDING': {
    label: 'MINOR BLEEDING',
    description: 'Slow blood flow detected. Apply gentle pressure.',
    precautions: ['Elevate the wound', 'Use clean cloth'],
  },
  'SEVERE_BLEEDING': {
    label: 'SEVERE BLEEDING',
    description: 'Heavy, continuous bleeding detected. High critical risk.',
    precautions: ['Apply MAX pressure', 'Do NOT remove soaked cloth — add more', 'Elevate the wound'],
  },
  'POISONING': {
    label: 'POSSIBLE POISONING',
    description: 'Toxic substance or symptoms detected. Call emergency services.',
    precautions: ['Do NOT induce vomiting', 'Identify the substance immediately'],
  },
};

const { width, height } = Dimensions.get('window');
const BACKEND_URL = 'http://172.16.40.207:8080';

export default function ARScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [currentOverlay, setCurrentOverlay] = useState<string | null>(null);

  // CPR Biometric State Trackers
  const compressionsCount = useRef(0);
  const lastWristY = useRef(0);
  const lastCompressionTime = useRef(Date.now());
  const lastVoiceCorrection = useRef(Date.now());
  const [hudData, setHudData] = useState<any>(null);
  const [keypoints, setKeypoints] = useState<any[]>([]);
  const [detectionSource, setDetectionSource] = useState<string>('');
  
  // Groq tracking state
  const [groqSteps, setGroqSteps] = useState<string[]>([]);
  const [voiceStep, setVoiceStep] = useState(0);
  const [voiceTotal, setVoiceTotal] = useState(0);

  const isProcessing = useRef(false);
  // LOCK: When true, we keep tracking but skip the heavy AI inference
  const isEmergencyActive = useRef(false);
  const lastCondition = useRef<string | null>(null);
  const cameraReady = useRef(false);
  const frameCount = useRef(0);
  const wristBaselineSet = useRef(false);

  useEffect(() => {
    if (!permission?.granted) {
      return () => { stopVoiceGuide(); };
    }

    const warmup = setTimeout(() => {
      cameraReady.current = true;
      console.log('[Camera] Ready — starting frame analysis');
    }, 3000);

    // ADAPTIVE POLLING: fast during emergencies, slow during idle scanning
    let stopped = false;
    const scheduleNext = () => {
      if (stopped) return;
      const delay = isEmergencyActive.current ? 800 : 3500;
      setTimeout(async () => {
        await analyzeCurrentFrame();
        scheduleNext();
      }, delay);
    };
    // Kick off after warmup
    setTimeout(scheduleNext, 3200);

    return () => {
      stopped = true;
      clearTimeout(warmup);
      stopVoiceGuide();
    };
  }, [permission]);

  const analyzeCurrentFrame = async () => {
    if (!cameraRef.current || isProcessing.current || !cameraReady.current) return;
    
    // We removed the hard lock here so MoveNet can keep tracking the 3D hand in real-time.
    // However, we pass activeCondition to the backend so the heavy AI (Groq) is bypassed!

    isProcessing.current = true;
    frameCount.current += 1;
    const frame = frameCount.current;

    try {
      let photo;
      try {
        photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.15,
        });
      } catch (captureErr) {
        console.log(`[Frame ${frame}] Camera not ready, skipping`);
        return;
      }

      if (!photo?.base64) {
        console.log(`[Frame ${frame}] No base64 data`);
        return;
      }

      console.log(`[Frame ${frame}] Sending...`);

      // 8-second timeout to prevent hanging on network issues
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(`${BACKEND_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          sessionId: 'live',
          imageBase64: photo.base64,
          lat: 0,
          lng: 0,
          activeCondition: isEmergencyActive.current ? lastCondition.current : null
        })
      });

      clearTimeout(timeout);

      const data = await response.json();
      console.log(`[Frame ${frame}] Backend response: ${data.condition_code} (${data.confidence}%) via ${data.source}`);

      if (data.condition_code && data.condition_code !== 'NONE' && data.condition_code !== 'CLEAR') {
        const condition = data.condition_code;
        
        // LOCK THE LOOP: We found an emergency!
        isEmergencyActive.current = true;
        
        // Start voice guide when condition CHANGES
        if (lastCondition.current !== condition) {
          console.log(`[Frame ${frame}] 🚨 NEW CONDITION: ${condition} — fetching instructions + starting voice`);
          lastCondition.current = condition;
          
          // Reset CPR biometric trackers for a clean start
          compressionsCount.current = 0;
          wristBaselineSet.current = false;
          lastCompressionTime.current = Date.now();
          lastVoiceCorrection.current = Date.now();
          
          // Fetch instructions (Groq or offline fallback)
          getMedicalInstructionsFromGroq(condition).then((steps) => {
            console.log(`[Frame ${frame}] Got ${steps.length} instruction steps`);
            setGroqSteps(steps);
            setVoiceStep(1);
            setVoiceTotal(steps.length);
            
            // Start speaking with new interactive engine
            initDynamicVoiceGuide(condition, steps, (step, total) => {
              console.log(`[Voice] Speaking step ${step}/${total}`);
              setVoiceStep(step);
              setVoiceTotal(total);
            });
          });
        }

        setCurrentOverlay(condition);
        setDetectionSource(data.source || 'unknown');

        // Use real keypoints from MoveNet
        if (data.keypoints && data.keypoints.length > 0) {
          setKeypoints(data.keypoints);

          // === REAL-TIME CPR COACHING ENGINE ===
          if (condition === 'CARDIAC_ARREST') {
            const now = Date.now();
            const canSpeak = async () => {
              const speaking = await Speech.isSpeakingAsync();
              return !speaking && (now - lastVoiceCorrection.current > 3000);
            };
            
            // 1. ARM STRAIGHTNESS CHECK (from backend MoveNet arm angle)
            if (data.rescuerArmsBent) {
              canSpeak().then(ok => {
                if (ok) {
                  Speech.speak("Keep your arms straight. Do not bend your elbows.", { rate: 1.25 });
                  lastVoiceCorrection.current = now;
                }
              });
            }

            // 2. HAND PLACEMENT CHECK (distance from sternum)
            const sternum = data.keypoints.find((k: any) => k.name === 'sternum');
            const wrist = data.keypoints.find((k: any) => k.name === 'right_wrist' || k.name === 'left_wrist');
            
            if (sternum && wrist && sternum.score > 0.3 && wrist.score > 0.3) {
              const dx = Math.abs(wrist.x - sternum.x);
              const dy_placement = Math.abs(wrist.y - sternum.y);
              
              // If hands are too far from sternum (> 15% of frame), warn
              if (dx > 0.15 || dy_placement > 0.15) {
                canSpeak().then(ok => {
                  if (ok) {
                    Speech.speak("Move your hands to the center of the chest.", { rate: 1.25 });
                    lastVoiceCorrection.current = now;
                  }
                });
              }
            }

            // 3. COMPRESSION MOTION TRACKER (Wrist Y delta)
            if (wrist && wrist.score && wrist.score > 0.3) {
              // Set baseline on first valid frame (prevents fake compression on init)
              if (!wristBaselineSet.current) {
                lastWristY.current = wrist.y;
                wristBaselineSet.current = true;
              } else {
                const dy = wrist.y - lastWristY.current;
                lastWristY.current = wrist.y;
                
                // Downward plunge > 0.03 normalized = 1 compression detected
                if (dy > 0.03) { 
                  compressionsCount.current += 1;
                  const timeSinceLast = now - lastCompressionTime.current;
                  lastCompressionTime.current = now;
                  
                  console.log(`[CPR] Compression #${compressionsCount.current} (interval: ${timeSinceLast}ms)`);
                  
                  // TOO SLOW: compression takes longer than 650ms (slower than ~92bpm)
                  if (timeSinceLast > 650) {
                    canSpeak().then(ok => {
                      if (ok) {
                        Speech.speak("Press faster. 100 to 120 times per minute.", { rate: 1.25 });
                        lastVoiceCorrection.current = now;
                      }
                    });
                  }
                  
                  // TOO FAST: compression takes less than 400ms (faster than ~150bpm)
                  if (timeSinceLast > 0 && timeSinceLast < 400) {
                    canSpeak().then(ok => {
                      if (ok) {
                        Speech.speak("Slow down slightly. Keep a steady rhythm.", { rate: 1.25 });
                        lastVoiceCorrection.current = now;
                      }
                    });
                  }
                  
                  // 30 COMPRESSIONS CYCLE → rescue breaths
                  if (compressionsCount.current >= 30) {
                    Speech.stop();
                    Speech.speak("30 compressions done. Give two rescue breaths now.", { rate: 1.25 });
                    compressionsCount.current = 0;
                    lastVoiceCorrection.current = now;
                  }
                }
              }
            }
          }

        } else {
          setKeypoints([
            { name: 'chest_midpoint', x: 0.5, y: 0.42 },
            { name: 'left_wrist', x: 0.35, y: 0.55 },
            { name: 'hip_midpoint', x: 0.5, y: 0.65 },
            { name: 'nose', x: 0.5, y: 0.25 },
            { name: 'left_elbow', x: 0.3, y: 0.48 },
          ]);
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
          console.log(`[Frame ${frame}] Scene clear — stopping voice guide`);
          lastCondition.current = null;
          isEmergencyActive.current = false;
          stopVoiceGuide();
          setVoiceStep(0);
          setVoiceTotal(0);
          setGroqSteps([]);
        }
        setCurrentOverlay(null);
        setHudData(null);
        setDetectionSource('');
      }
    } catch (error) {
      console.log(`[Frame ${frame}] ❌ Failed:`, error);
    } finally {
      isProcessing.current = false;
    }
  };

  const clearEmergency = () => {
    console.log('[UI] Manual Clear Emergency triggered');
    Speech.stop();
    stopVoiceGuide();
    setCurrentOverlay(null);
    setHudData(null);
    setDetectionSource('');
    setGroqSteps([]);
    setVoiceStep(0);
    setVoiceTotal(0);
    lastCondition.current = null;
    isEmergencyActive.current = false; // UNLOCK camera loop
    // Reset CPR biometric trackers
    compressionsCount.current = 0;
    wristBaselineSet.current = false;
    lastWristY.current = 0;
    lastCompressionTime.current = Date.now();
    lastVoiceCorrection.current = Date.now();
  };

  if (!permission?.granted) {
    return (
      <View style={styles.center}>
        <Button title="Allow Camera Permission" onPress={requestPermission} />
      </View>
    );
  }

  // Get current step text
  const currentStepText = currentOverlay && groqSteps.length > 0
    ? groqSteps[Math.min(Math.max(0, voiceStep - 1), groqSteps.length - 1)]
    : null;

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
      />

      {/* Medical AR Overlays — SVG + 3D body-anchored */}
      {currentOverlay && (
        <OverlayManager overlayType={currentOverlay} keypoints={keypoints} />
      )}

      {/* Clear Button at Top Right */}
      {currentOverlay && (
        <TouchableOpacity style={styles.clearBadge} onPress={clearEmergency}>
          <Text style={styles.clearBadgeText}>✓ CLEAR</Text>
        </TouchableOpacity>
      )}

      {/* Holo-Guide UI (top bar, step counter, buttons) */}
      <HoloGuideUI 
        condition={currentOverlay} 
        stepText={currentStepText || "Scanning environment for medical emergencies..."}
        currentStep={Math.max(1, voiceStep)}
        totalSteps={groqSteps.length || 5}
        isLoadingInstructions={!!currentOverlay && groqSteps.length === 0}
      />

      {/* === BIG BOLD INSTRUCTION OVERLAY === */}
      {currentStepText && (
        <View style={styles.bigInstructionBox}>
          <Text style={styles.bigInstructionStep}>
            STEP {voiceStep} OF {groqSteps.length}
          </Text>
          <Text style={styles.bigInstructionText}>
            {currentStepText}
          </Text>
          
          {/* Interactive Voice Controls */}
          <View style={styles.controlsRow}>
            <TouchableOpacity style={styles.controlButton} onPress={prevStep}>
              <Text style={styles.controlText}>{"< PREV"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButtonRepeat} onPress={repeatStep}>
              <Text style={styles.controlText}>{"↻ REPEAT"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton} onPress={nextStep}>
              <Text style={styles.controlText}>{"NEXT >"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  clearBadge: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 100,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
  },
  clearBadgeText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },
  bigInstructionBox: {
    position: 'absolute',
    bottom: 50,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 18,
    padding: 20,
    borderWidth: 2,
    borderColor: '#00CC88',
    shadowColor: '#00CC88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  bigInstructionStep: {
    color: '#00CC88',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 8,
  },
  bigInstructionText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 20,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  controlButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 5,
  },
  controlButtonRepeat: {
    backgroundColor: 'rgba(0, 204, 136, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#00CC88',
  },
  controlText: {
    color: '#FFF',
    textAlign: 'center',
    fontWeight: '800',
    fontSize: 14,
  }
});