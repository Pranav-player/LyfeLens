/**
 * HoloGuideUI v2 — matches the user's sketch exactly:
 *  - Home button (top-left)
 *  - BLUR OUTSIDE (frosted vignette edges, light theme)
 *  - 3D Hands in center (handled by HoloScene3D, this is just the UI layer)
 *  - PRECAUTIONS button (bottom-left floating)
 *  - CALL HELPLINE button (bottom-right floating)
 *  - INSTRUCTION CHANGING WITH TIME (bottom center banner)
 *  - Condition label + step counter (top bar)
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Dimensions,
  Modal,
  ScrollView,
  Linking,
  Animated as RNAnimated,
} from 'react-native';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

// Condition metadata
const CONDITION_META: Record<
  string,
  { label: string; icon: string; color: string; precautions: string[] }
> = {
  CARDIAC_ARREST: {
    label: 'CARDIAC ARREST',
    icon: '💓',
    color: '#0077CC',
    precautions: [
      'Do NOT stop compressions until help arrives',
      'Push on a firm, flat surface',
      'Lock your elbows straight — use body weight',
      'Compress at least 5 cm (2 inches) deep',
      'Rate: 100–120 beats per minute',
    ],
  },
  BLEEDING: {
    label: 'SEVERE BLEEDING',
    icon: '🩸',
    color: '#CC3344',
    precautions: [
      'Do NOT remove soaked cloth — add more on top',
      'Wear gloves if available',
      'Elevate the wound above the heart level',
      'Do NOT use a tourniquet unless bleeding is life-threatening',
    ],
  },
  BURNS: {
    label: 'BURN INJURY',
    icon: '🔥',
    color: '#CC7700',
    precautions: [
      'NO ice — only cool running water',
      'NO butter, toothpaste, or creams',
      'Do NOT pop blisters',
      'Do NOT remove clothing stuck to skin',
      'Cover loosely with cling film after cooling',
    ],
  },
  BURNS_FIRST_DEGREE: {
    label: '1ST DEGREE BURN',
    icon: '☀️',
    color: '#DD8800',
    precautions: [
      'Run cool water for 10-20 minutes',
      'NO ice — it damages tissue further',
      'Aloe vera gel can help soothe pain',
      'Take over-the-counter pain relief if needed',
      'Cover loosely to protect',
    ],
  },
  BURNS_SECOND_DEGREE: {
    label: '2ND DEGREE BURN',
    icon: '🔥',
    color: '#CC4400',
    precautions: [
      'Run cool water IMMEDIATELY for 20 minutes',
      'Do NOT pop or drain blisters',
      'NO creams, butter, or toothpaste',
      'Cover loosely with cling film or sterile dressing',
      'Seek medical attention if larger than 3 inches',
    ],
  },
  BURNS_THIRD_DEGREE: {
    label: '3RD DEGREE BURN — CRITICAL',
    icon: '🚨',
    color: '#CC0000',
    precautions: [
      'Call 112 / emergency services IMMEDIATELY',
      'Do NOT run water on a 3rd degree burn',
      'Do NOT remove clothing stuck to the burn',
      'Cover with a clean, dry cloth',
      'Keep the person warm — watch for shock',
      'Do NOT apply ANY ointment or cream',
    ],
  },
  CHOKING: {
    label: 'CHOKING',
    icon: '😮',
    color: '#CC6600',
    precautions: [
      'Do NOT do blind finger sweeps in the mouth',
      'If unconscious, start CPR immediately',
      'Back blows first (5x), then abdominal thrusts (5x)',
      'Call 112 immediately if choking persists',
    ],
  },
  SEIZURE: {
    label: 'ACTIVE SEIZURE',
    icon: '⚡',
    color: '#CC9900',
    precautions: [
      'Do NOT restrain or hold them down',
      'Do NOT put anything in their mouth',
      'Clear area of sharp or hard objects',
      'Call 112 if seizure lasts more than 5 minutes',
    ],
  },
  STROKE: {
    label: 'POSSIBLE STROKE',
    icon: '🧠',
    color: '#007799',
    precautions: [
      'Do NOT give food or water',
      'Note the exact time symptoms started',
      'Do NOT leave them alone',
      'Keep them calm and still',
    ],
  },
  FRACTURE: {
    label: 'SUSPECTED FRACTURE',
    icon: '🦴',
    color: '#8855AA',
    precautions: [
      'Do NOT try to realign the bone',
      'Immobilize above AND below the injury',
      'Do NOT remove shoes if ankle/foot fracture',
      'Watch for swelling, numbness, or pale skin',
    ],
  },
  UNCONSCIOUS_BREATHING: {
    label: 'UNCONSCIOUS — BREATHING',
    icon: '😴',
    color: '#228844',
    precautions: [
      'Do NOT lay flat on back — recovery position only',
      'Monitor breathing every 2 minutes',
      'If breathing stops, start CPR immediately',
      'Keep them warm',
    ],
  },
  MINOR_CUT: {
    label: 'MINOR CUT',
    icon: '🩹',
    color: '#228844',
    precautions: [
      'Wash hands before touching wound',
      'Clean wound to prevent infection',
      'Apply clean sterile bandage'
    ],
  },
  MAJOR_CUT: {
    label: 'MAJOR CUT',
    icon: '🩸',
    color: '#CC3344',
    precautions: [
      'Do NOT wash the wound',
      'Apply direct, heavy pressure immediately',
      'Elevate the injured area'
    ],
  },
  MINOR_BLEEDING: {
    label: 'MINOR BLEEDING',
    icon: '🩹',
    color: '#CC7700',
    precautions: [
      'Elevate the wound',
      'Use a clean cloth to apply pressure'
    ],
  },
  SEVERE_BLEEDING: {
    label: 'SEVERE BLEEDING',
    icon: '🚨',
    color: '#CC3344',
    precautions: [
      'Apply MAX pressure immediately',
      'Do NOT remove soaked cloth — add more on top',
      'Elevate the wound high above the heart'
    ],
  },
  POISONING: {
    label: 'POSSIBLE POISONING',
    icon: '🧪',
    color: '#8855AA',
    precautions: [
      'Do NOT induce vomiting',
      'Try to identify the exact substance',
      'Keep the airway clear'
    ],
  },
};

type HoloGuideProps = {
  condition: string | null;
  stepText: string;
  currentStep?: number;
  totalSteps?: number;
  isLoadingInstructions?: boolean;
};

export default function HoloGuideUI({
  condition,
  stepText,
  currentStep = 1,
  totalSteps = 5,
  isLoadingInstructions = false,
}: HoloGuideProps) {
  const router = useRouter();
  const [precautionsVisible, setPrecautionsVisible] = useState(false);
  const pulseAnim = React.useRef(new RNAnimated.Value(1)).current;
  const bannerAnim = React.useRef(new RNAnimated.Value(0)).current;

  // Pulse animation for LIVE badge
  useEffect(() => {
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pulseAnim, { toValue: 1.15, duration: 700, useNativeDriver: true }),
        RNAnimated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  // Fade-in banner when step text changes
  useEffect(() => {
    bannerAnim.setValue(0);
    RNAnimated.timing(bannerAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [stepText]);

  // Shimmer animation for Skeleton loading state
  const shimmerAnim = React.useRef(new RNAnimated.Value(0.3)).current;
  useEffect(() => {
    if (isLoadingInstructions) {
      RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.timing(shimmerAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
          RNAnimated.timing(shimmerAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      shimmerAnim.stopAnimation();
    }
  }, [isLoadingInstructions, shimmerAnim]);

  const meta = condition ? CONDITION_META[condition] || CONDITION_META['CARDIAC_ARREST'] : null;

  // === SCANNING STATE ===
  if (!condition) {
    return (
      <View style={styles.scanningWrapper} pointerEvents="none">
        <View style={styles.scanningBadge}>
          <Text style={styles.scanningDot}>⬤</Text>
          <Text style={styles.scanningText}>Scanning for emergencies…</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">

      {/* ======================================================
       *  1. FROSTED VIGNETTE EDGES — light theme blur outside
       * ====================================================== */}
      <View style={styles.vignetteTop} pointerEvents="none" />
      <View style={styles.vignetteBottom} pointerEvents="none" />
      <View style={styles.vignetteLeft} pointerEvents="none" />
      <View style={styles.vignetteRight} pointerEvents="none" />

      {/* ======================================================
       *  2. TOP BAR — Home · Condition · LIVE badge
       * ====================================================== */}
      <View style={styles.topBar} pointerEvents="box-none">
        {/* Home Button */}
        <Pressable
          id="home-btn"
          style={({ pressed }) => [styles.homeBtn, pressed && { opacity: 0.75 }]}
          onPress={() => router.push('/explore')}
        >
          <Text style={styles.homeBtnText}>⌂ Home</Text>
        </Pressable>

        {/* Condition Label */}
        <View style={[styles.conditionBadge, { borderColor: meta?.color || '#0077CC' }]}>
          <Text style={styles.conditionIcon}>{meta?.icon}</Text>
          <Text style={[styles.conditionLabel, { color: meta?.color || '#0077CC' }]}>
            {meta?.label}
          </Text>
        </View>

        {/* LIVE Badge */}
        <RNAnimated.View style={[styles.liveBadge, { transform: [{ scale: pulseAnim }] }]}>
          <View style={[styles.liveDot, { backgroundColor: meta?.color || '#CC0000' }]} />
          <Text style={styles.liveText}>LIVE</Text>
        </RNAnimated.View>
      </View>

      {/* ======================================================
       *  3. STEP COUNTER (below top bar, right side)
       * ====================================================== */}
      <View style={styles.stepCounter} pointerEvents="none">
        <Text style={styles.stepCounterText}>
          Step {currentStep} of {totalSteps}
        </Text>
        <View style={styles.stepDots}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.stepDot,
                i < currentStep ? styles.stepDotFilled : styles.stepDotEmpty,
                { backgroundColor: i < currentStep ? (meta?.color || '#0077CC') : 'rgba(200,210,220,0.5)' },
              ]}
            />
          ))}
        </View>
      </View>

      {/* ======================================================
       *  4. BOTTOM ACTION AREA
       * ====================================================== */}
      <View style={styles.bottomArea} pointerEvents="box-none">

        {/* --- Floating Button Row --- */}
        <View style={styles.buttonRow} pointerEvents="box-none">
          {/* PRECAUTIONS Button */}
          <Pressable
            id="precautions-btn"
            style={({ pressed }) => [styles.precautionBtn, pressed && styles.btnPressed]}
            onPress={() => setPrecautionsVisible(true)}
          >
            <Text style={styles.btnIcon}>⚠️</Text>
            <Text style={styles.precautionBtnText}>PRECAUTIONS</Text>
          </Pressable>

          {/* CALL HELPLINE Button */}
          <Pressable
            id="call-helpline-btn"
            style={({ pressed }) => [styles.callBtn, pressed && styles.btnPressed]}
            onPress={() => Linking.openURL('tel:112')}
          >
            <Text style={styles.btnIcon}>📞</Text>
            <Text style={styles.callBtnText}>CALL 112</Text>
          </Pressable>
        </View>

        {/* --- Instruction Banner --- */}
        <RNAnimated.View
          style={[styles.instructionBanner, { opacity: bannerAnim }]}
          pointerEvents="none"
        >
          <Text style={[styles.instructionCondition, { color: meta?.color || '#0077CC' }]}>
            {meta?.icon} {meta?.label}
          </Text>
          {isLoadingInstructions ? (
            <View style={{ marginTop: 8, gap: 8 }}>
              <RNAnimated.View style={[styles.skeletonLine, { opacity: shimmerAnim, width: '90%' }]} />
              <RNAnimated.View style={[styles.skeletonLine, { opacity: shimmerAnim, width: '70%' }]} />
              <RNAnimated.View style={[styles.skeletonLine, { opacity: shimmerAnim, width: '50%' }]} />
            </View>
          ) : (
            <Text style={styles.instructionBody} numberOfLines={3}>
              {stepText || 'Follow the 3D hologram instructions.'}
            </Text>
          )}
        </RNAnimated.View>
      </View>

      {/* ======================================================
       *  5. PRECAUTIONS MODAL
       * ====================================================== */}
      <Modal
        visible={precautionsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPrecautionsVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setPrecautionsVisible(false)}
        >
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { backgroundColor: meta?.color || '#0077CC' }]}>
              <Text style={styles.modalTitle}>⚠️ PRECAUTIONS</Text>
              <Text style={styles.modalSubtitle}>{meta?.label}</Text>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {(meta?.precautions || []).map((p, i) => (
                <View key={i} style={styles.precautionRow}>
                  <View style={[styles.precautionBullet, { backgroundColor: meta?.color || '#0077CC' }]} />
                  <Text style={styles.precautionText}>{p}</Text>
                </View>
              ))}
              <View style={{ height: 20 }} />
            </ScrollView>

            {/* Close Button */}
            <Pressable
              style={[styles.modalCloseBtn, { backgroundColor: meta?.color || '#0077CC' }]}
              onPress={() => setPrecautionsVisible(false)}
            >
              <Text style={styles.modalCloseBtnText}>GOT IT ✓</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

/* =========================================================
 *  STYLES
 * ========================================================= */
// Light frosted white — user-friendly, doesn't block camera center
const VIGNETTE = 'rgba(240, 248, 255, 0.65)';

const styles = StyleSheet.create({
  // ─── Scanning state ────────────────────────────────────────
  scanningWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 60,
  },
  scanningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 30,
    shadowColor: '#0066CC',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  scanningDot: { color: '#55AA88', fontSize: 12, marginRight: 8 },
  scanningText: { fontSize: 15, fontWeight: '600', color: '#334455' },

  // ─── Vignette edges ────────────────────────────────────────
  vignetteTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 130,
    backgroundColor: VIGNETTE,
  },
  vignetteBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 220,
    backgroundColor: VIGNETTE,
  },
  vignetteLeft: {
    position: 'absolute',
    top: 130,
    bottom: 220,
    left: 0,
    width: 28,
    backgroundColor: VIGNETTE,
  },
  vignetteRight: {
    position: 'absolute',
    top: 130,
    bottom: 220,
    right: 0,
    width: 28,
    backgroundColor: VIGNETTE,
  },

  // ─── Top bar ───────────────────────────────────────────────
  topBar: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  homeBtn: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  homeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334455',
    letterSpacing: 0.3,
  },
  conditionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    maxWidth: width * 0.45,
  },
  conditionIcon: { fontSize: 14, marginRight: 6 },
  conditionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  liveText: { fontSize: 12, fontWeight: '800', color: '#334455', letterSpacing: 1 },

  // ─── Step counter ──────────────────────────────────────────
  stepCounter: {
    position: 'absolute',
    top: 108,
    right: 16,
    alignItems: 'flex-end',
  },
  stepCounterText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#557799',
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 5,
    overflow: 'hidden',
  },
  stepDots: {
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 6,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepDotFilled: {},
  stepDotEmpty: {},

  // ─── Bottom area ───────────────────────────────────────────
  bottomArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 40,
    paddingHorizontal: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  precautionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 28,
    shadowColor: '#335577',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  precautionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334455',
    letterSpacing: 0.5,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8234A',
    paddingVertical: 13,
    paddingHorizontal: 22,
    borderRadius: 28,
    shadowColor: '#E8234A',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  callBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  btnIcon: { fontSize: 16, marginRight: 7 },
  btnPressed: { opacity: 0.8, transform: [{ scale: 0.96 }] },

  // ─── Instruction banner ────────────────────────────────────
  skeletonLine: {
    height: 14,
    backgroundColor: '#D1D9E6',
    borderRadius: 6,
  },
  instructionBanner: {
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    borderRadius: 22,
    paddingVertical: 20,
    paddingHorizontal: 22,
    shadowColor: '#224477',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 10,
    alignItems: 'center',
  },
  instructionCondition: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  instructionBody: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a2a3a',
    textAlign: 'center',
    lineHeight: 26,
  },

  // ─── Precautions Modal ─────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: height * 0.65,
    overflow: 'hidden',
  },
  modalHeader: {
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
  },
  modalBody: {
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  precautionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  precautionBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: 12,
    flexShrink: 0,
  },
  precautionText: {
    flex: 1,
    fontSize: 15,
    color: '#334455',
    lineHeight: 22,
    fontWeight: '500',
  },
  modalCloseBtn: {
    margin: 20,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
