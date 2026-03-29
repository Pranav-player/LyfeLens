import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

// Always force light theme for LyfeLens (medical AR app — light mode only)
const LyfeLensTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#F7FAFA',
    primary: '#207665',
  },
};

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <ThemeProvider value={LyfeLensTheme}>
      <Stack>
        {/* Splash / onboarding screen */}
        <Stack.Screen name="splash" options={{ headerShown: false, animation: 'fade' }} />
        {/* Main tabbed app */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* Modal */}
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Info' }} />
      </Stack>
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}
