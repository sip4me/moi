import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { YoungSerif_400Regular } from '@expo-google-fonts/young-serif';
import { Stack } from 'expo-router';
import { Platform, Text, useWindowDimensions, View } from 'react-native';
import { Logo } from '../components/ui';
import { C, F } from '../theme';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StoreProvider } from '../state/store';
import React, { useEffect } from 'react';
import { markOpened } from '../lib/push';

/** A tapped reminder opens /?n=<id>; record it so the sender knows reminders are being read. */
function useOpenedReminder() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const id = new URLSearchParams(window.location.search).get('n');
    if (id) markOpened(id).catch(() => {});
  }, []);
}

export default function RootLayout() {
  useOpenedReminder();
  const [loaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, YoungSerif_400Regular });
  if (!loaded) return null;
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <StatusBar style="dark" />
        <Frame>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#fff' } }}>
          <Stack.Screen name="why/[id]" options={{ presentation: 'transparentModal', animation: 'fade' }} />
          <Stack.Screen name="feed/[id]" options={{ presentation: 'transparentModal', animation: 'fade' }} />
          <Stack.Screen name="change" options={{ presentation: 'modal' }} />
          <Stack.Screen name="reminders" options={{ presentation: 'modal' }} />
        </Stack>
        </Frame>
      </StoreProvider>
    </SafeAreaProvider>
  );
}

// Phones: full-bleed. Tablets and desktops: the app sits in a phone-sized
// frame on a warm canvas, so every screen keeps the proportions it was designed at.
function Frame({ children }: { children: React.ReactNode }) {
  const { width, height } = useWindowDimensions();
  const framed = Platform.OS === 'web' && width >= 600 && height >= 560;
  if (!framed) return <View style={{ flex: 1 }}>{children}</View>;
  const h = Math.min(height - 48, 900);
  const side = width >= 1024;
  return (
    <View style={{ flex: 1, backgroundColor: '#F1EEE9', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 96 }}>
      {side ? (
        <View style={{ width: 340, gap: 20 }}>
          <Logo size={56} />
          <Text style={{ fontFamily: F.bold, fontSize: 40, lineHeight: 46, letterSpacing: -1, color: C.ink }}>Your daily{'\n'}hair plan.</Text>
          <Text style={{ fontFamily: F.regular, fontSize: 17, lineHeight: 25, color: C.gray2 }}>Moi is made for your phone. Open this page there and add it to your home screen for reminders.</Text>
        </View>
      ) : null}
      <View style={{ width: 430, height: h, borderRadius: 44, overflow: 'hidden', backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', shadowColor: '#2A221B', shadowOpacity: 0.14, shadowRadius: 48, shadowOffset: { width: 0, height: 24 } }}>
        {children}
      </View>
    </View>
  );
}
