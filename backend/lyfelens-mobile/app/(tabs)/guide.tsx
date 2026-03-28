/**
 * First Aid Guide — Offline reference page
 * All 8 emergency conditions with step-by-step instructions.
 * No camera needed — learn before an emergency happens.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const BRAND = '#207665';
const BG = '#F7FAFA';
const CARD = '#FFFFFF';

const CONDITIONS = [
  {
    code: 'CARDIAC_ARREST',
    icon: '💓',
    title: 'Cardiac Arrest',
    subtitle: 'Person unresponsive, not breathing normally',
    color: '#0077CC',
    bgLight: '#EBF5FF',
    steps: [
      'Call 112 immediately — shout for an AED if one is nearby.',
      'Kneel beside them. Place heel of hand on center of chest (between nipples).',
      'Lock fingers together. Straighten elbows. Use your body weight.',
      'Push DOWN at least 5 cm. Push fast — 100 to 120 times per minute.',
      'After 30 compressions: tilt head, lift chin, give 2 rescue breaths.',
      'Continue 30:2 ratio until ambulance arrives or AED is ready.',
    ],
    warning: 'Do NOT stop until professional help takes over.',
  },
  {
    code: 'BURNS',
    icon: '🔥',
    title: 'Burn Injury',
    subtitle: 'Thermal, chemical, or electrical burn',
    color: '#CC7700',
    bgLight: '#FFF7EB',
    steps: [
      'Run COOL (not cold) tap water over the burn immediately.',
      'Keep water flowing for at LEAST 10 full minutes without stopping.',
      'Gently remove clothing or jewelry near the burn (if not stuck to skin).',
      'Cover loosely with cling film or a clean non-fluffy cloth.',
      'Call 112 for large burns, face, hands, or suspected chemical burns.',
    ],
    warning: 'NEVER: ice, butter, toothpaste, or any creams. NEVER pop blisters.',
  },
  {
    code: 'BLEEDING',
    icon: '🩸',
    title: 'Severe Bleeding',
    subtitle: 'Heavy, rapid, or uncontrolled blood loss',
    color: '#CC2244',
    bgLight: '#FFF0F3',
    steps: [
      'Use gloves if available. Press a clean cloth hard onto the wound.',
      'Do NOT lift the cloth to check — keep firm, continuous pressure.',
      'If cloth soaks through, add more cloth on top without removing first layer.',
      'Raise the injured area above heart level to slow blood flow.',
      'For severe limb bleeding: tie a tight tourniquet 5–7 cm above the wound.',
    ],
    warning: 'Do NOT remove the first cloth layer — removing it disturbs clotting.',
  },
  {
    code: 'CHOKING',
    icon: '😮',
    title: 'Choking',
    subtitle: 'Airway blocked — cannot breathe or speak',
    color: '#CC6600',
    bgLight: '#FFF5E6',
    steps: [
      'Ask: "Are you choking?" — if they nod or cannot speak, act immediately.',
      'Give up to 5 sharp back blows between the shoulder blades.',
      'If blows fail: stand behind, wrap arms around their waist.',
      'Make a fist above belly button. Grab it. Pull sharply INWARD and UP.',
      'Alternate 5 back blows + 5 abdominal thrusts until object is cleared.',
    ],
    warning: 'If they become unconscious — lower carefully and begin CPR.',
  },
  {
    code: 'SEIZURE',
    icon: '⚡',
    title: 'Seizure',
    subtitle: 'Uncontrolled muscle shaking or convulsions',
    color: '#BB8800',
    bgLight: '#FFFBEB',
    steps: [
      'Stay calm. Start timing the seizure immediately.',
      'Clear sharp objects, furniture, and hard items from the area.',
      'Place something soft under their head (jacket, bag, folded cloth).',
      'Do NOT hold them down, restrain movements, or put anything in mouth.',
      'When it stops, gently roll them onto their side — recovery position.',
      'Call 112 if it lasts over 5 min, or if they do not regain consciousness.',
    ],
    warning: 'NEVER put fingers or objects in their mouth — risk of biting.',
  },
  {
    code: 'STROKE',
    icon: '🧠',
    title: 'Stroke — FAST',
    subtitle: 'Sudden brain attack — time is critical',
    color: '#007799',
    bgLight: '#E8F8FB',
    steps: [
      'Call 112 immediately. Note the EXACT time symptoms started.',
      'F — Face: Ask them to smile. Does one side droop?',
      'A — Arms: Ask to raise both arms. Does one drift down?',
      'S — Speech: Ask to repeat a sentence. Is it slurred or strange?',
      'T — Time: Get to hospital FAST. Every minute = 2 million brain cells lost.',
    ],
    warning: 'Do NOT give food, water, or medication. Do NOT leave them alone.',
  },
  {
    code: 'FRACTURE',
    icon: '🦴',
    title: 'Suspected Fracture',
    subtitle: 'Broken or cracked bone',
    color: '#7755AA',
    bgLight: '#F5F0FF',
    steps: [
      'Do NOT attempt to straighten or realign the bone — leave it as-is.',
      'Stop any bleeding by pressing gently around (not on) the injury.',
      'Immobilize above and below the fracture with padding or a makeshift splint.',
      'Apply the splint gently: rigid item + bandage secured loosely.',
      'Regularly check circulation: pulse, warmth, color, and sensation below injury.',
    ],
    warning: 'Moving the bone can cause nerve or blood vessel damage.',
  },
  {
    code: 'UNCONSCIOUS_BREATHING',
    icon: '😴',
    title: 'Unconscious & Breathing',
    subtitle: 'Person is breathing but unresponsive',
    color: '#228844',
    bgLight: '#EDFAF3',
    steps: [
      'Shout their name and tap their shoulder — check for a response.',
      'Tilt their head back and lift the chin to open and clear the airway.',
      'Roll them onto their side — this is the recovery position.',
      'Bend the top knee forward to maintain a stable, safe position.',
      'Check breathing every 2 minutes. If it stops — start CPR immediately.',
    ],
    warning: 'Never lay an unconscious person flat on their back — risk of choking.',
  },
];

type ExpandedState = Record<string, boolean>;

export default function GuideScreen() {
  const router = useRouter();
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const toggle = (code: string) =>
    setExpanded(prev => ({ ...prev, [code]: !prev[code] }));

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          id="guide-back-btn"
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Text style={styles.backBtnText}>← Back</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>First Aid Guide</Text>
          <Text style={styles.headerSub}>Offline · Always Available</Text>
        </View>
        <Pressable
          id="guide-call-btn"
          style={styles.emergencyBtn}
          onPress={() => Linking.openURL('tel:112')}
        >
          <Text style={styles.emergencyBtnText}>📞 112</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro */}
        <Animated.View entering={FadeInUp.duration(500)} style={styles.introBanner}>
          <Text style={styles.introTitle}>📋 Emergency Reference</Text>
          <Text style={styles.introBody}>
            Tap any condition to see step-by-step first aid instructions. Keep this page bookmarked before emergencies arise.
          </Text>
        </Animated.View>

        {/* Condition Cards */}
        {CONDITIONS.map((cond, idx) => {
          const isOpen = !!expanded[cond.code];
          return (
            <Animated.View
              key={cond.code}
              entering={FadeInUp.duration(400).delay(idx * 60)}
              style={[styles.card, isOpen && { borderColor: cond.color, borderWidth: 1.5 }]}
            >
              {/* Card Header — tap to expand */}
              <Pressable
                id={`guide-${cond.code}-btn`}
                style={[styles.cardHeader, isOpen && { backgroundColor: cond.bgLight }]}
                onPress={() => toggle(cond.code)}
              >
                <View style={[styles.cardIconBox, { backgroundColor: cond.bgLight }]}>
                  <Text style={styles.cardIcon}>{cond.icon}</Text>
                </View>
                <View style={styles.cardHeaderText}>
                  <Text style={[styles.cardTitle, { color: cond.color }]}>{cond.title}</Text>
                  <Text style={styles.cardSubtitle}>{cond.subtitle}</Text>
                </View>
                <Text style={[styles.chevron, { color: cond.color }]}>
                  {isOpen ? '▲' : '▼'}
                </Text>
              </Pressable>

              {/* Expanded Steps */}
              {isOpen && (
                <View style={styles.stepsSection}>
                  {cond.steps.map((step, i) => (
                    <View key={i} style={styles.stepRow}>
                      <View style={[styles.stepNumber, { backgroundColor: cond.color }]}>
                        <Text style={styles.stepNumberText}>{i + 1}</Text>
                      </View>
                      <Text style={styles.stepText}>{step}</Text>
                    </View>
                  ))}

                  {/* Warning row */}
                  <View style={[styles.warningRow, { borderColor: cond.color }]}>
                    <Text style={styles.warningIcon}>⚠️</Text>
                    <Text style={[styles.warningText, { color: cond.color }]}>
                      {cond.warning}
                    </Text>
                  </View>

                  {/* Use AR Scanner CTA */}
                  <Pressable
                    id={`guide-${cond.code}-ar-btn`}
                    style={[styles.arBtn, { backgroundColor: cond.color }]}
                    onPress={() => router.push('/(tabs)/')}
                  >
                    <Text style={styles.arBtnText}>📷  Open AR Scanner</Text>
                  </Pressable>
                </View>
              )}
            </Animated.View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8EDF0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  backBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F0F5F8',
    borderRadius: 12,
  },
  backBtnText: { fontSize: 13, fontWeight: '700', color: '#334455' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#1E293B' },
  headerSub: { fontSize: 11, color: '#94A3B8', fontWeight: '600', marginTop: 2 },
  emergencyBtn: {
    backgroundColor: '#E8234A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  emergencyBtnText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },

  // Scroll
  scrollContent: { padding: 16 },

  // Intro banner
  introBanner: {
    backgroundColor: BRAND,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  introTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  introBody: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.88)',
    lineHeight: 20,
    fontWeight: '500',
  },

  // Cards
  card: {
    backgroundColor: CARD,
    borderRadius: 18,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8EDF0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
  },
  cardIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardIcon: { fontSize: 26 },
  cardHeaderText: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '800', marginBottom: 3 },
  cardSubtitle: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  chevron: { fontSize: 13, fontWeight: '800', marginLeft: 8 },

  // Steps
  stepsSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F4F8',
    paddingTop: 14,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 1,
    flexShrink: 0,
  },
  stepNumberText: { fontSize: 12, fontWeight: '900', color: '#FFFFFF' },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#334455',
    lineHeight: 21,
    fontWeight: '500',
  },

  // Warning
  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBF0',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginTop: 4,
    marginBottom: 14,
  },
  warningIcon: { fontSize: 16, marginRight: 10, marginTop: 1 },
  warningText: { flex: 1, fontSize: 13, fontWeight: '700', lineHeight: 19 },

  // AR CTA
  arBtn: {
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  arBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
