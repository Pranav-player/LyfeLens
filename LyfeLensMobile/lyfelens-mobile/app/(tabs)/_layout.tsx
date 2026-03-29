import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BRAND = '#207665';
const INACTIVE = '#94A3B8';
const TAB_BG = '#FFFFFF';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: BRAND,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: {
          backgroundColor: TAB_BG,
          borderTopWidth: 1,
          borderTopColor: '#E8EDF2',
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -4 },
          elevation: 16,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.3,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />

      {/* Tab 2: Dashboard */}
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              backgroundColor: focused ? `${BRAND}18` : 'transparent',
              width: 40,
              height: 28,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="guide"
        options={{
          href: null,
        }}
      />

      {/* Tab 4: Heroes */}
      <Tabs.Screen
        name="heroes"
        options={{
          title: 'Heroes',
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              backgroundColor: focused ? `${BRAND}18` : 'transparent',
              width: 40,
              height: 28,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Ionicons
                name={focused ? 'people' : 'people-outline'}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
