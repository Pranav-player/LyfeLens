import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, Pressable, ActivityIndicator, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Location from 'expo-location';

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

const DEFAULT_LOCATION = { lat: 28.6139, lon: 77.2090 }; // Fallback: New Delhi

const EMERGENCY_CONTACTS = [
  { id: 'ambulance', label: 'Ambulance', number: '108', icon: 'medkit' as const, detail: 'National emergency ambulance service' },
  { id: 'allInOne', label: 'National Emergency', number: '112', icon: 'call' as const, detail: 'Police, fire, medical unified helpline' },
  { id: 'nhai', label: 'NHAI Helpline', number: '1033', icon: 'car-sport' as const, detail: 'Highway emergency and road assistance' },
];

export default function DashboardScreen() {
  const router = useRouter();
  const [userLocation, setUserLocation] = useState(DEFAULT_LOCATION);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [hospitals, setHospitals] = useState<Facility[]>([]);
  const [loadingCareData, setLoadingCareData] = useState(true);

  const callEmergencyNumber = async (number: string) => {
    const telUrl = `tel:${number.replace(/\s+/g, '')}`;
    try {
      const canOpen = await Linking.canOpenURL(telUrl);
      if (canOpen) {
        await Linking.openURL(telUrl);
      }
    } catch {
      // Ignore dialer open failures to avoid crashing the dashboard.
    }
  };

  const openHospitalInGoogleMaps = async (hospital: Facility) => {
    const query =
      typeof hospital.lat === 'number' && typeof hospital.lon === 'number'
        ? `${hospital.lat},${hospital.lon}`
        : encodeURIComponent(hospital.name);

    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;

    try {
      const canOpen = await Linking.canOpenURL(mapUrl);
      if (canOpen) {
        await Linking.openURL(mapUrl);
      }
    } catch {
      // Ignore map open failures.
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (isMounted) {
            setLocationError('Location permission denied. Showing fallback area.');
          }
          return;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (isMounted) {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        }
      } catch {
        if (isMounted) {
          setLocationError('Unable to get current location. Showing fallback area.');
        }
      } finally {
        if (isMounted) {
          setLocationLoading(false);
        }
      }
    };

    loadLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoadingCareData(true);
      const liveData = await fetchNearbyFacilities(userLocation.lat, userLocation.lon, 8000);

      if (isMounted) {
        const nearbyHospitals = liveData
          .filter((facility) => facility.type.toLowerCase().includes('hospital'))
          .slice(0, 3);

        setHospitals(nearbyHospitals);
        setLoadingCareData(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [userLocation]);

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

        {/* --- Nearby Hospitals Section --- */}
        <Animated.View entering={FadeInUp.duration(600).delay(200)} style={styles.mapSection}>
          <Text style={styles.sectionTitle}>Nearby Hospitals</Text>
          <Text style={styles.sectionSubtitle}>Closest hospitals based on your current location.</Text>

          {(locationLoading || loadingCareData) ? (
            <View style={styles.mapLoadingState}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.mapHelperText}>Finding nearby hospitals...</Text>
            </View>
          ) : (
            <View style={styles.hospitalList}>
              {hospitals.slice(0, 3).map((hospital) => (
                <View key={hospital.id} style={styles.hospitalRow}>
                  <Pressable
                    style={({ pressed }) => [styles.hospitalRowLeft, pressed && { opacity: 0.75 }]}
                    onPress={() => openHospitalInGoogleMaps(hospital)}
                  >
                    <View style={styles.hospitalIconWrap}>
                      <Ionicons name="business" size={16} color={COLORS.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.hospitalName}>{hospital.name}</Text>
                      <Text style={styles.hospitalMeta}>Hospital • {hospital.distance}</Text>
                    </View>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [styles.smallCallBtn, pressed && { opacity: 0.8 }]}
                    onPress={() => callEmergencyNumber(hospital.phone || '112')}
                  >
                    <Ionicons name="call" size={13} color={COLORS.white} />
                    <Text style={styles.smallCallBtnText}>Call</Text>
                  </Pressable>
                </View>
              ))}

              {hospitals.length === 0 ? (
                <View style={styles.emptyHospitalsCard}>
                  <Text style={styles.emptyHospitalsText}>No nearby hospitals found right now.</Text>
                </View>
              ) : null}

              {locationError ? <Text style={styles.mapErrorText}>{locationError}</Text> : null}
            </View>
          )}
        </Animated.View>

        {/* --- Rescue Numbers --- */}
        <Animated.View entering={FadeInUp.duration(600).delay(300)} style={styles.facilitiesSection}>
          <Text style={styles.sectionTitle}>Rescue Numbers & Emergency Calls</Text>
          <Text style={styles.sectionSubtitle}>Tap to call verified emergency services instantly.</Text>

          <View style={styles.rescueList}>
            {EMERGENCY_CONTACTS.map((contact) => (
              <Pressable
                key={contact.id}
                onPress={() => callEmergencyNumber(contact.number)}
                style={({ pressed }) => [styles.rescueCard, pressed && { opacity: 0.86 }]}
              >
                <View style={styles.rescueLeft}>
                  <View style={styles.rescueIconWrap}>
                    <Ionicons name={contact.icon} size={18} color={COLORS.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rescueLabel}>{contact.label}</Text>
                    <Text style={styles.rescueDetail}>{contact.detail}</Text>
                  </View>
                </View>

                <View style={styles.rescueCallPill}>
                  <Ionicons name="call" size={14} color={COLORS.white} />
                  <Text style={styles.rescueCallText}>{contact.number}</Text>
                </View>
              </Pressable>
            ))}
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
  mapLoadingState: { height: 220, borderRadius: 24, borderWidth: 1, borderColor: '#DCE4F0', backgroundColor: COLORS.cardBg, justifyContent: 'center', alignItems: 'center' },
  mapHelperText: { marginTop: 10, fontSize: 12, color: COLORS.textBody, fontWeight: '500' },
  hospitalList: { gap: 10 },
  hospitalRow: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hospitalRowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 },
  hospitalIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  hospitalName: { fontSize: 14, fontWeight: '700', color: COLORS.textHeader, marginBottom: 2 },
  hospitalMeta: { fontSize: 12, color: COLORS.textBody },
  smallCallBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  smallCallBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 12 },
  emptyHospitalsCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  emptyHospitalsText: { fontSize: 13, color: COLORS.textBody, fontWeight: '600' },
  mapErrorText: { paddingHorizontal: 12, paddingVertical: 10, fontSize: 12, color: COLORS.alertRed, backgroundColor: '#FFF1F2' },

  // Facilities
  facilitiesSection: { marginBottom: 40 },
  rescueList: { gap: 10 },
  rescueCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rescueLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  rescueIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.sageLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  rescueLabel: { fontSize: 14, fontWeight: '800', color: COLORS.textHeader, marginBottom: 2 },
  rescueDetail: { fontSize: 12, color: COLORS.textBody, lineHeight: 17 },
  rescueCallPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    gap: 6,
  },
  rescueCallText: { color: COLORS.white, fontWeight: '700', fontSize: 12 },

  // Floating Action Button
  fabContainer: { position: 'absolute', bottom: 30, left: 20, right: 20, alignItems: 'center' },
  fab: { flexDirection: 'row', backgroundColor: COLORS.primary, paddingVertical: 18, paddingHorizontal: 32, borderRadius: 30, alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 6 },
  fabText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' }
});
