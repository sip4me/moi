import { Redirect } from 'expo-router';

/** Goals and hair now live on the "Routines for" screen, with skin, makeup and body. Old links land there. */
export default function Goals() {
  return <Redirect href="/routine/about" />;
}
