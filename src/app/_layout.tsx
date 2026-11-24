import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { YoungSerif_400Regular } from '@expo-google-fonts/young-serif';
import { InstrumentSerif_400Regular, InstrumentSerif_400Regular_Italic } from '@expo-google-fonts/instrument-serif';
import { AbrilFatface_400Regular } from '@expo-google-fonts/abril-fatface';
import { Stack, usePathname } from 'expo-router';
import { Platform, Text, useWindowDimensions, View } from 'react-native';
import { BrandText, Logo } from '../components/ui';
import { C, F } from '../theme';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MoiNotifications } from '../components/MoiNotifications';
import { StoreProvider, useStore } from '../state/store';
import { isActive, loadSubscription } from '../lib/billing';
import React, { useEffect } from 'react';
import { markOpened } from '../lib/push';
import { useContentProtection } from '../lib/protect';

/**
 * Web loads Latin-subset WOFF2 copies (about 265 KB in all, instead of 1.6 MB of TTF), so the first screen
 * appears much sooner. Native apps keep the full TTF files.
 */
// Phones: render the whole UI one step smaller (88%) by widening the layout viewport and scaling it down,
// so everything fits more per screen and stays sharp (no CSS zoom, which breaks layout widths).
if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof document !== 'undefined') {
  const sw = Math.min(window.screen?.width || window.innerWidth, window.innerWidth);
  const meta = document.querySelector('meta[name="viewport"]');
  if (meta && sw > 0 && sw < 600) meta.setAttribute('content', `width=${Math.round(sw / 0.88)}, initial-scale=0.88, minimum-scale=0.88, maximum-scale=0.88, user-scalable=no, viewport-fit=cover`);
}

// Web: someone who lands deep inside Routine (a shared link, a refresh) still gets the Moi welcome
// one step behind them, so the browser's Back shows it instead of leaving the site.
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  const { pathname, search, hash } = window.location;
  if (pathname.startsWith('/routine/') && pathname !== '/routine/welcome' && !window.history.state?.moiBase) {
    window.history.replaceState({ moiBase: true }, '', '/routine/welcome');
    window.history.pushState({ moiBase: true }, '', pathname + search + hash);
  }
}

const FONTS = Platform.OS === 'web'
  ? {
      Inter_400Regular: require('../../assets/fonts/Inter_400Regular.woff2'),
      Inter_500Medium: require('../../assets/fonts/Inter_500Medium.woff2'),
      Inter_600SemiBold: require('../../assets/fonts/Inter_600SemiBold.woff2'),
      Inter_700Bold: require('../../assets/fonts/Inter_700Bold.woff2'),
      YoungSerif_400Regular: require('../../assets/fonts/YoungSerif_400Regular.woff2'),
      InstrumentSerif_400Regular: require('../../assets/fonts/InstrumentSerif_400Regular.woff2'),
      InstrumentSerif_400Regular_Italic: require('../../assets/fonts/InstrumentSerif_400Regular_Italic.woff2'),
      AbrilFatface_400Regular: require('../../assets/fonts/AbrilFatface_400Regular.woff2'),
    }
  : { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, YoungSerif_400Regular, InstrumentSerif_400Regular, InstrumentSerif_400Regular_Italic, AbrilFatface_400Regular };

/** A tapped reminder opens /?n=<id>; record it so the sender knows reminders are being read. */
function useOpenedReminder() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const id = new URLSearchParams(window.location.search).get('n');
    if (id) markOpened(id).catch(() => {});
  }, []);
}

/**
 * Keeps `subscribed` in step with Stripe (via the subscriptions row the webhook writes): on launch and
 * whenever the app comes back to the foreground. With no row yet (Stripe not set up, or never checked
 * out), the local flag is left as it is.
 */
function SubscriptionSync() {
  const { setSubscribed } = useStore();
  useEffect(() => {
    const check = () => loadSubscription().then(s => { if (s) setSubscribed(isActive(s)); }).catch(() => {});
    check();
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const onVis = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

export default function RootLayout() {
  useOpenedReminder();
  useContentProtection();
  const [loaded] = useFonts(FONTS);
  if (!loaded) return null;
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <StatusBar style="dark" />
        <SubscriptionSync />
        <Frame>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#fff' } }}>
          <Stack.Screen name="why/[id]" options={{ presentation: 'transparentModal', animation: 'fade' }} />
          <Stack.Screen name="feed/[id]" options={{ presentation: 'transparentModal', animation: 'fade' }} />
          <Stack.Screen name="change" options={{ presentation: 'modal' }} />
          <Stack.Screen name="search" options={{ animation: 'fade' }} />
          <Stack.Screen name="glamour" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
          <Stack.Screen name="reminders" options={{ presentation: 'modal' }} />
        </Stack>
        <MoiNotifications />
        </Frame>
      </StoreProvider>
    </SafeAreaProvider>
  );
}

// Phones: full-bleed. Tablets and desktops: the app sits in a phone-sized
// frame on a warm canvas, so every screen keeps the proportions it was designed at.
function Frame({ children }: { children: React.ReactNode }) {
  const { width, height } = useWindowDimensions();
  const path = usePathname();
  // The front door and the routine builder are designed for laptops too, so they run full width.
  const fullWidth = path === '/' || path.startsWith('/routine');
  const framed = Platform.OS === 'web' && width >= 600 && height >= 560 && !fullWidth;
  if (!framed) return <View style={{ flex: 1 }}>{children}</View>;
  const h = Math.min(height - 48, 900);
  const side = width >= 1024;
  return (
    <View style={{ flex: 1, backgroundColor: '#F1EEE9', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 96 }}>
      {side ? (
        <View style={{ width: 340, gap: 20 }}>
          <Logo size={56} />
          <Text style={{ fontFamily: F.bold, fontSize: 40, lineHeight: 46, letterSpacing: -1, color: C.ink }}>Your daily{'\n'}hair plan.</Text>
          <BrandText text="Moi is made for your phone. Open this page there and add it to your home screen for reminders." size={17} weight="regular" color={C.gray2} lineHeight={1.47} />
        </View>
      ) : null}
      <View style={{ width: 430, height: h, borderRadius: 44, overflow: 'hidden', backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', shadowColor: '#2A221B', shadowOpacity: 0.14, shadowRadius: 48, shadowOffset: { width: 0, height: 24 } }}>
        {children}
      </View>
    </View>
  );
}
