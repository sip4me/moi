import { Redirect } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { isHydrated } from '../lib/routine/model';
import { useStore } from '../state/store';

/** The front door: the Moi welcome every time the app is opened, then Routine. The daily tracker is an add-on inside Routine. */
export default function Index() {
  const { hydrated, onboarded } = useStore();
  if (!hydrated || !isHydrated()) return null;
  // A tapped reminder (/?n=<id>) still goes straight to the tracker.
  if (Platform.OS === 'web' && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('n')) return <Redirect href={onboarded ? '/(tabs)' : '/onboarding'} />;
  return <Redirect href="/routine/welcome" />;
}
