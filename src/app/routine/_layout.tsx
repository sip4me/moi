import { Stack } from 'expo-router';

export default function RoutineLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: '#F8F9FA' } }} />;
}
