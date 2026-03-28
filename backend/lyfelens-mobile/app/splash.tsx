/**
 * LyfeLens Splash Screen
 * Animated logo + tagline + "Get Started" CTA
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  Animated,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();

  // Animation values
  const logoScale = useRef(new Animated.Value(0.4)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineY = useRef(new Animated.Value(20)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;
  const btnY = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Sequence: logo pop → tagline slide up → button fade in
    Animated.sequence([
      // Logo bounces in
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      // Tagline slides up
      Animated.parallel([
        Animated.timing(taglineOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(taglineY, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      // Button fades in
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(btnOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(btnY, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
    ]).start();

    // Pulse the logo heart forever
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    ).start();

    // Expanding ring
    Animated.loop(
      Animated.sequence([
        Animated.timing(ringAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(ringAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  const ringStyle = {
    transform: [{ scale: ringAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 2.2] }) }],
    opacity: ringAnim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.5, 0.2, 0] }),
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0FAF7" />

      {/* Soft tinted background overlay */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#F0FAF7' }]} />

      {/* Decorative circles */}
      <View style={[styles.decorCircle, { top: -80, right: -80 }]} />
      <View style={[styles.decorCircle2, { bottom: -60, left: -60 }]} />

      {/* Logo section */}
      <View style={styles.logoSection}>
        {/* Pulse ring behind logo */}
        <Animated.View style={[styles.pulseRing, ringStyle]} />

        {/* Main logo badge */}
        <Animated.View
          style={[
            styles.logoBadge,
            {
              opacity: logoOpacity,
              transform: [{ scale: Animated.multiply(logoScale, pulseAnim) }],
            },
          ]}
        >
          {/* Lens circle */}
          <View style={styles.lensOuter}>
            <View style={styles.lensInner}>
              {/* Heart inside lens */}
              <Text style={styles.heartEmoji}>🫀</Text>
            </View>
          </View>
        </Animated.View>

        {/* App name */}
        <Animated.View style={{ opacity: logoOpacity, marginTop: 28 }}>
          <Text style={styles.appName}>
            <Text style={styles.appNameLyfe}>Lyfe</Text>
            <Text style={styles.appNameLens}>Lens</Text>
          </Text>
          <Text style={styles.appVersion}>Emergency AI · v1.0</Text>
        </Animated.View>
      </View>

      {/* Tagline */}
      <Animated.View
        style={[
          styles.taglineSection,
          {
            opacity: taglineOpacity,
            transform: [{ translateY: taglineY }],
          },
        ]}
      >
        <Text style={styles.tagline}>See Emergency.</Text>
        <Text style={styles.tagline}>
          Act <Text style={styles.taglineAccent}>Instantly.</Text>
        </Text>
        <Text style={styles.taglineSub}>
          Real-time AR guidance powered by AI{'\n'}for life-saving first aid.
        </Text>
      </Animated.View>

      {/* Feature pills */}
      <Animated.View style={[styles.pillRow, { opacity: taglineOpacity }]}>
        {['🧠 AI Powered', '📷 AR Vision', '🔊 Voice Guide'].map((label, i) => (
          <View key={i} style={styles.pill}>
            <Text style={styles.pillText}>{label}</Text>
          </View>
        ))}
      </Animated.View>

      {/* CTA Button */}
      <Animated.View
        style={{
          opacity: btnOpacity,
          transform: [{ translateY: btnY }],
          paddingHorizontal: 32,
          width: '100%',
        }}
      >
        <Pressable
          id="get-started-btn"
          style={({ pressed }) => [styles.ctaBtn, pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] }]}
          onPress={() => router.replace('/(tabs)/explore')}
        >
          <Text style={styles.ctaBtnText}>Get Started →</Text>
        </Pressable>

        <Pressable
          id="open-scanner-btn"
          style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.7 }]}
          onPress={() => router.replace('/')}
        >
          <Text style={styles.secondaryBtnText}>📷  Open AR Scanner</Text>
        </Pressable>
      </Animated.View>

      {/* Footer tagline */}
      <Text style={styles.footer}>Built for emergencies. Designed for everyone.</Text>
    </View>
  );
}

const BRAND_GREEN = '#207665';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  decorCircle: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(32,118,101,0.07)',
  },
  decorCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(91,184,245,0.08)',
  },

  // Logo
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  pulseRing: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
    borderColor: BRAND_GREEN,
  },
  logoBadge: {
    width: 110,
    height: 110,
    borderRadius: 32,
    backgroundColor: BRAND_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BRAND_GREEN,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  lensOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lensInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartEmoji: { fontSize: 32 },
  appName: {
    fontSize: 42,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -1,
  },
  appNameLyfe: { color: BRAND_GREEN },
  appNameLens: { color: '#1E293B' },
  appVersion: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: 4,
  },

  // Tagline
  taglineSection: {
    alignItems: 'center',
    marginBottom: 28,
    paddingHorizontal: 40,
  },
  tagline: {
    fontSize: 34,
    fontWeight: '900',
    color: '#1E293B',
    textAlign: 'center',
    lineHeight: 42,
    letterSpacing: -0.5,
  },
  taglineAccent: { color: BRAND_GREEN },
  taglineSub: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 16,
    fontWeight: '500',
  },

  // Pills
  pillRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 36,
    paddingHorizontal: 20,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  pill: {
    backgroundColor: '#F0FAF7',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#C8E8E0',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '700',
    color: BRAND_GREEN,
  },

  // CTA
  ctaBtn: {
    backgroundColor: BRAND_GREEN,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: BRAND_GREEN,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
    marginBottom: 14,
  },
  ctaBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#DCE4E0',
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  secondaryBtnText: {
    color: '#334455',
    fontSize: 15,
    fontWeight: '700',
  },

  footer: {
    position: 'absolute',
    bottom: 20,
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});
