import { Redirect } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { useStore } from '../state/store';

/** The front door is Routine. The daily tracker is an add-on, opened from Routine's menu. */
export default function Index() {
  const { hydrated, onboarded } = useStore();
  if (!hydrated) return null;
  // A tapped reminder (/?n=<id>) still goes straight to the tracker.
  if (Platform.OS === 'web' && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('n')) return <Redirect href={onboarded ? '/(tabs)' : '/onboarding'} />;
  return <Redirect href="/routine" />;
}
