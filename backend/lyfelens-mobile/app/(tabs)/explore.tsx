import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, Pressable, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, Easing } from 'react-native-reanimated';
import Svg, { Circle, RadialGradient as SvgGradient, Defs, Stop } from 'react-native-svg';

// Import our new internet API utility
import { fetchNearbyFacilities, Facility } from '../../src/services/osmApi';

const { width } = Dimensions.get('window');

// LyfeLens premium brand colors (based on constraints)
const COLORS = {
  primary: '#207665', // Healthify Deep Green
  background: '#FCFCFA', // Off-White
  cardBg: '#FFFFFF',
  sageLight: '#E6EDE9',
  sageBorder: '#DCE4E0',
  textHeader: '#1E293B', // Charcoal
  textBody: '#64748B', // Muted slate
  alertRed: '#E11D48',
  white: '#FFFFFF',
};

// --- Custom Animated Radar Component ---
// Builds a stunning UI Map pulsing "zones" instead of heavy Google Maps
const RadarMap = () => {
  const pulse1 = useSharedValue(0.2);
  const pulse2 = useSharedValue(0.1);

  useEffect(() => {
    pulse1.value = withRepeat(
      withTiming(0.7, { duration: 2500, easing: Easing.out(Easing.quad) }),
      -1, true
    );
    pulse2.value = withRepeat(
      withSequence(withTiming(0.4, { duration: 1500 }), withTiming(0, { duration: 1500 })),
      -1, false
    );
  }, []);

  const animatedStyle1 = useAnimatedStyle(() => ({ opacity: pulse1.value, transform: [{ scale: 1 + pulse1.value }] }));
  const animatedStyle2 = useAnimatedStyle(() => ({ opacity: pulse2.value, transform: [{ scale: 2 + pulse2.value * 2 }] }));

  return (
    <View style={styles.radarContainer}>
      {/* Abstract Map Background */}
      <View style={styles.abstractMap} />
      
      {/* Live Zones */}
      <View style={[styles.zoneWrapper, { top: '30%', left: '40%' }]}>
        <Animated.View style={[styles.pulseCircle, animatedStyle2, { backgroundColor: COLORS.alertRed }]} />
        <Animated.View style={[styles.glowCircle, animatedStyle1, { backgroundColor: COLORS.alertRed }]} />
        <View style={[styles.dot, { backgroundColor: COLORS.alertRed }]} />
        <View style={styles.zoneLabel}><Text style={styles.zoneLabelText}>Accident Reported</Text></View>
      </View>

      <View style={[styles.zoneWrapper, { top: '60%', right: '25%' }]}>
        <Animated.View style={[styles.glowCircle, animatedStyle1, { backgroundColor: '#FF8800' }]} />
        <View style={[styles.dot, { backgroundColor: '#FF8800' }]} />
      </View>
    </View>
  );
};

export default function DashboardScreen() {
  const router = useRouter();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      // Fetches LIVE internet data using Overpass mapping API
      const liveData = await fetchNearbyFacilities(28.6139, 77.2090, 8000); 
      setFacilities(liveData.slice(0, 5)); // Take top 5 for UI performance
      setLoading(false);
    };
    loadData();
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* --- Hero Section --- */}
        <Animated.View entering={FadeInUp.duration(600).delay(100)} style={styles.heroSection}>
          <Text style={styles.heroSubtitle}>★ INTRODUCING THE FUTURE</Text>
          <Text style={styles.heroTitle}>Meet LyfeLens.{'\n'}Health Made Safe{'\n'}With AI.</Text>
          <Text style={styles.heroDescription}>
            Empower yourself with real-time AR guidance during emergencies & meet your AI-powered first-aid assistant.
          </Text>
        </Animated.View>

        {/* --- Live Map Pulse Section --- */}
        <Animated.View entering={FadeInUp.duration(600).delay(200)} style={styles.mapSection}>
          <Text style={styles.sectionTitle}>Critical Zones Nearby</Text>
          <Text style={styles.sectionSubtitle}>Live monitoring across your city network.</Text>
          <RadarMap />
        </Animated.View>

        {/* --- Real Internet Fetched API (Doctors/Hospitals) --- */}
        <Animated.View entering={FadeInUp.duration(600).delay(300)} style={styles.facilitiesSection}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.sectionTitle}>Emergency Care Near You</Text>
              <Text style={styles.sectionSubtitle}>Fetched dynamically via OpenStreetMap API.</Text>
            </View>
            {loading && <ActivityIndicator size="small" color={COLORS.primary} />}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            {facilities.map((f, i) => (
              <View key={i} style={styles.facilityCard}>
                <View style={styles.facilityIconBox}>
                  <Ionicons name={f.type === 'Hospital' ? 'medical' : 'medkit'} size={24} color={COLORS.primary} />
                </View>
                <Text style={styles.facilityName} numberOfLines={1}>{f.name}</Text>
                <Text style={styles.facilityMeta}>{f.type} • {f.distance}</Text>
                
                <Pressable style={styles.outlineBtn}>
                  <Text style={styles.outlineBtnText}>Call {f.phone || 'Directory'}</Text>
                </Pressable>
              </View>
            ))}
          </ScrollView>
        </Animated.View>

        {/* --- Dietary Advice / Specific Disease Precautions --- */}
        <Animated.View entering={FadeInUp.duration(600).delay(400)} style={styles.adviceSection}>
          <Text style={styles.sectionTitle}>Condition Preventatives</Text>
          <View style={styles.cardList}>
            <View style={styles.adviceCard}>
              <View style={[styles.adviceIcon, { backgroundColor: '#FFE4E6' }]}>
                <Ionicons name="fast-food" size={20} color={COLORS.alertRed} />
              </View>
              <View style={styles.adviceTextRow}>
                <Text style={styles.adviceHeader}>Post-Stroke Diet</Text>
                <Text style={styles.adviceBody}>Avoid high-sodium foods, butter, and heavy saturated fats to prevent hypertension spikes.</Text>
              </View>
            </View>

            <View style={styles.adviceCard}>
              <View style={[styles.adviceIcon, { backgroundColor: '#FEF08A' }]}>
                <Ionicons name="warning" size={20} color="#CA8A04" />
              </View>
              <View style={styles.adviceTextRow}>
                <Text style={styles.adviceHeader}>Seizure Triggers</Text>
                <Text style={styles.adviceBody}>Do NOT force water or soft foods during recovery to prevent fatal airway choking.</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* --- Community Stories --- */}
        <Animated.View entering={FadeInUp.duration(600).delay(500)} style={styles.storiesSection}>
          <Text style={styles.sectionTitle}>Heroes Among Us</Text>
          <View style={styles.storyCard}>
            <View style={styles.storyHeader}>
              <View style={styles.avatar}><Text style={styles.avatarText}>M</Text></View>
              <View>
                <Text style={styles.storyName}>Maya Sharma</Text>
                <Text style={styles.storyMeta}>Used LyfeLens for CPR</Text>
              </View>
            </View>
            <Text style={styles.storyText}>
              "I didn't know how to locked my elbows. The AR scanner showed me exactly where to push down. The 100 BPM rhythm voice saved my father's life while the ambulance was arriving."
            </Text>
          </View>
        </Animated.View>

        {/* Extra bottom padding to avoid FAB overlap */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* --- Sticky Primary Action Button --- */}
      <Animated.View style={styles.fabContainer}>
        <Pressable 
          style={({ pressed }) => [styles.fab, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
          onPress={() => router.push('/')}
        >
          <Ionicons name="scan-circle" size={28} color={COLORS.white} style={{ marginRight: 8 }} />
          <Text style={styles.fabText}>Open AR Scanner</Text>
        </Pressable>
      </Animated.View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },
  
  // App Typography
  sectionTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textHeader, marginBottom: 4, letterSpacing: -0.3 },
  sectionSubtitle: { fontSize: 13, color: COLORS.textBody, marginBottom: 16, fontWeight: '500' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  // Hero
  heroSection: { marginBottom: 35 },
  heroSubtitle: { color: COLORS.primary, fontSize: 12, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12 },
  heroTitle: { fontSize: 42, fontWeight: '900', color: COLORS.textHeader, lineHeight: 46, marginBottom: 16, letterSpacing: -1 },
  heroDescription: { fontSize: 16, color: COLORS.textBody, lineHeight: 24, fontWeight: '500', paddingRight: 20 },

  // Live map UI
  mapSection: { marginBottom: 40 },
  radarContainer: { width: '100%', height: 200, backgroundColor: COLORS.sageLight, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#DCE4F0' },
  abstractMap: { ...StyleSheet.absoluteFillObject, opacity: 0.5, backgroundColor: '#E0E8E5', backgroundImage: 'radial-gradient(circle, #D0D8D5 1px, transparent 1px)', backgroundSize: '10px 10px' as any }, // Simulate a map grid visually
  zoneWrapper: { position: 'absolute', width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, zIndex: 10 },
  glowCircle: { position: 'absolute', width: 30, height: 30, borderRadius: 15 },
  pulseCircle: { position: 'absolute', width: 60, height: 60, borderRadius: 30, opacity: 0.1 },
  zoneLabel: { position: 'absolute', top: 20, backgroundColor: COLORS.white, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3 },
  zoneLabelText: { fontSize: 10, fontWeight: 'bold', color: COLORS.alertRed },

  // Facilities
  facilitiesSection: { marginBottom: 40 },
  horizontalScroll: { paddingRight: 40, gap: 16 },
  facilityCard: { width: 160, backgroundColor: COLORS.cardBg, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: COLORS.sageBorder, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 1 },
  facilityIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.sageLight, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  facilityName: { fontSize: 14, fontWeight: '700', color: COLORS.textHeader, marginBottom: 4 },
  facilityMeta: { fontSize: 11, color: COLORS.textBody, marginBottom: 14 },
  outlineBtn: { borderWidth: 1, borderColor: COLORS.primary, borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  outlineBtnText: { color: COLORS.primary, fontSize: 11, fontWeight: 'bold' },

  // Advice
  adviceSection: { marginBottom: 40 },
  cardList: { gap: 12, marginTop: 16 },
  adviceCard: { flexDirection: 'row', backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.sageBorder, alignItems: 'center' },
  adviceIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  adviceTextRow: { flex: 1 },
  adviceHeader: { fontSize: 14, fontWeight: '700', color: COLORS.textHeader, marginBottom: 4 },
  adviceBody: { fontSize: 12, color: COLORS.textBody, lineHeight: 18 },

  // Stories
  storiesSection: { marginBottom: 20 },
  storyCard: { backgroundColor: COLORS.primary, borderRadius: 24, padding: 24, shadowColor: COLORS.primary, shadowOpacity: 0.15, shadowRadius: 15, shadowOffset: { width: 0, height: 10 } },
  storyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: COLORS.white, fontWeight: '800', fontSize: 16 },
  storyName: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  storyMeta: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  storyText: { color: 'rgba(255,255,255,0.95)', fontSize: 14, lineHeight: 22, fontStyle: 'italic' },

  // Floating Action Button
  fabContainer: { position: 'absolute', bottom: 30, left: 20, right: 20, alignItems: 'center' },
  fab: { flexDirection: 'row', backgroundColor: COLORS.primary, paddingVertical: 18, paddingHorizontal: 32, borderRadius: 30, alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 6 },
  fabText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' }
});
