# LyfeLens Frontend Architecture Guide

This document is designed to help the frontend team understand the current unified structure of LyfeLens, locate key components, and easily polish or update the UI.

## 📱 App Structure & Navigation

The app is built using **Expo Router** and uses a hidden tab-based layout to allow seamless switching between the immersive AR Scanner and the informative dashboard.

### Core Entry Points
- **`app/(tabs)/_layout.tsx`**: Controls the foundational navigation. The bottom tab bar is currently hidden (`display: 'none'`) so the AR camera feels like a native, immersive full-screen experience.
- **`app/(tabs)/index.tsx`**: The **AR Scanner / Camera View**. This is the default landing screen. It contains the camera feed, the overlay manager, the Voice Guidance service, and the floating glassmorphic "Home" button.
- **`app/(tabs)/explore.tsx`**: The **Dashboard**. This is the scrolling "Healthify-inspired" screen containing the pulsing map, nearby medical facilities, community stories, and dietary advice.

## 🎨 UI Styling & Theme

The current design utilizes a specific color palette defined in `explore.tsx`. If you want to refine the styling, look for the `COLORS` object:

```typescript
const COLORS = {
  primary: '#207665', // Deep Green
  background: '#FCFCFA', // Off-White
  cardBg: '#FFFFFF',
  sageLight: '#E6EDE9',
  sageBorder: '#DCE4E0',
  textHeader: '#1E293B', // Charcoal
  textBody: '#64748B', // Muted slate
  alertRed: '#E11D48',
  white: '#FFFFFF',
};
```
*Note: The UI currently uses standard React Native `StyleSheet` objects. If you plan to migrate to a framework like Tailwind (NativeWind), you will need to apply those classes manually here.*

## 🌐 Live Data Fetching (Medical Facilities)

We are fetching **real** hospitals, clinics, and doctors nearby without requiring any API keys.

- **File**: `src/services/osmApi.ts`
- **How it works**: It hits the free OpenStreetMap Overpass API (`https://overpass-api.de/api/interpreter`).
- **Current Mock Config**: By default, it uses hardcoded coordinates (`lat: 28.6139, lon: 77.2090` - New Delhi) so the presentation always shows data. 
- **To Do for Teammate**:
  - Connect this to `expo-location` to get the user's *actual* device coordinates for the fetch.
  - Refine the horizontal scroll view rendering in `explore.tsx` for a cleaner look.

## 🧩 Key Custom Components

### 1. `RadarMap` (Inside `explore.tsx`)
Because linking actual Google Maps (`react-native-maps`) can cause native build crashes in standard Expo Go, we created an intricate animated SVG mock map. It uses `react-native-reanimated` to create red and orange "pulsing" critical zones. 
*(If you want to replace this with real maps, ensure the native Android/iOS builds are configured properly first).*

### 2. AR Overlays (`src/overlays/`)
The actual 3D-like Iron Man AR overlays exist here:
- `CPROverlay.tsx`
- `BleedingOverlay.tsx`
- `BurnsOverlay.tsx`
- `SeizureOverlay.tsx`

These use heavily mathematical SVG animations. **Do not disturb the keypoint scaling math** unless you are intentionally modifying how the AI tracks the body.

### 3. Voice Guidance (`src/overlays/services/voiceGuide.ts`)
A lightweight wrapper around `expo-speech` that intercepts emergency conditions and speaks step-by-step instructions.

## 🛠️ Areas to Polish (For Your Teammate)

1. **Dashboard Typography**: Enhance the font weights and perhaps introduce a custom font (like `Inter` or a Serif) inside `explore.tsx` to match the exact "Healthify" mockup perfectly.
2. **Scroll Padding**: Adjust the padding and margins of the horizontally scrolling `facilitiesSection` inside the Dashboard.
3. **Location Services**: Implement real GPS fetching before sending requests to the Overpass API.
4. **Transition Animations**: The routing between `/` (index) and `/explore` is instant. You might want to add custom React Navigation fade/slide transitions in the `_layout.tsx` file.

Happy coding! 🚀
