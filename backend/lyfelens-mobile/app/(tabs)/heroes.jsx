import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';

const COLORS = {
  primary: '#207665',
  background: '#FCFCFA',
  cardBg: '#FFFFFF',
  textHeader: '#1E293B',
  textBody: '#64748B',
  white: '#FFFFFF',
};

const HERO_STORIES = [
  {
    id: '1',
    name: 'Maya Sharma',
    context: 'Used LyfeLens for CPR',
    story:
      "I didn't know how to lock my elbows. The AR scanner showed me exactly where to push. The rhythm guidance helped me stay calm until ambulance support reached us.",
  },
  {
    id: '2',
    name: 'Rohan Mehta',
    context: 'Guided burn first-aid response',
    story:
      'The step-by-step overlay reminded us to cool the burn with running water and avoid home remedies. Those instructions likely prevented the injury from worsening.',
  },
  {
    id: '3',
    name: 'Ananya Verma',
    context: 'Detected stroke signs quickly',
    story:
      'FAST checks in the guide made us call emergency services immediately. Reaching the hospital faster made all the difference in treatment outcome.',
  },
];

export default function HeroesScreen() {
  const [opinion, setOpinion] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const submitOpinion = () => {
    if (!opinion.trim()) {
      return;
    }

    setIsSubmitted(true);
    setOpinion('');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.duration(600).delay(100)} style={styles.heroSection}>
          <Text style={styles.heroSubtitle}>COMMUNITY IMPACT</Text>
          <Text style={styles.heroTitle}>Heroes Among Us</Text>
          <Text style={styles.heroDescription}>
            Real stories from people who used LyfeLens during critical moments.
          </Text>
        </Animated.View>

        {HERO_STORIES.map((item, idx) => (
          <Animated.View key={item.id} entering={FadeInUp.duration(500).delay(180 + idx * 100)} style={styles.storyCard}>
            <View style={styles.storyHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
              </View>
              <View style={styles.storyMetaWrap}>
                <Text style={styles.storyName}>{item.name}</Text>
                <Text style={styles.storyMeta}>{item.context}</Text>
              </View>
              <Ionicons name="sparkles" size={18} color={COLORS.white} />
            </View>
            <Text style={styles.storyText}>{item.story}</Text>
          </Animated.View>
        ))}

        <Animated.View entering={FadeInUp.duration(500).delay(500)} style={styles.feedbackCard}>
          <Text style={styles.feedbackTitle}>Share your opinion about LyfeLens</Text>
          <Text style={styles.feedbackSubtitle}>Tell us what helped you most or what we should improve.</Text>

          <TextInput
            value={opinion}
            onChangeText={(text) => {
              setOpinion(text);
              if (isSubmitted) {
                setIsSubmitted(false);
              }
            }}
            placeholder="Type your feedback here..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={4}
            style={styles.feedbackInput}
          />

          <Pressable
            style={({ pressed }) => [
              styles.feedbackButton,
              (!opinion.trim() || pressed) && styles.feedbackButtonDisabled,
            ]}
            disabled={!opinion.trim()}
            onPress={submitOpinion}
          >
            <Text style={styles.feedbackButtonText}>Submit Opinion</Text>
          </Pressable>

          {isSubmitted ? <Text style={styles.feedbackThanks}>Thanks! Your opinion has been recorded.</Text> : null}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40, gap: 16 },

  heroSection: { marginBottom: 10 },
  heroSubtitle: { color: COLORS.primary, fontSize: 12, fontWeight: '700', letterSpacing: 1.3, marginBottom: 8 },
  heroTitle: { fontSize: 34, fontWeight: '900', color: COLORS.textHeader, marginBottom: 10, letterSpacing: -0.8 },
  heroDescription: { fontSize: 15, color: COLORS.textBody, lineHeight: 22, fontWeight: '500' },

  storyCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    padding: 20,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 9 },
  },
  storyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  storyMetaWrap: { flex: 1 },
  storyName: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  storyMeta: { color: 'rgba(255,255,255,0.78)', fontSize: 12, marginTop: 2 },
  storyText: { color: 'rgba(255,255,255,0.95)', fontSize: 14, lineHeight: 22 },

  feedbackCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#DCE4E0',
    marginTop: 8,
  },
  feedbackTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textHeader, marginBottom: 6 },
  feedbackSubtitle: { fontSize: 13, color: COLORS.textBody, lineHeight: 19, marginBottom: 12 },
  feedbackInput: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.textHeader,
    fontSize: 14,
    textAlignVertical: 'top',
    backgroundColor: '#F8FAFC',
  },
  feedbackButton: {
    marginTop: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  feedbackButtonDisabled: { opacity: 0.55 },
  feedbackButtonText: { color: COLORS.white, fontSize: 14, fontWeight: '700' },
  feedbackThanks: { marginTop: 10, color: COLORS.primary, fontSize: 13, fontWeight: '600' },
});
