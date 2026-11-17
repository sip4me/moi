import { Redirect } from 'expo-router';
// Any unknown path (e.g. /index.html on some hosts) goes to the start of the app.
export default function NotFound() {
  return <Redirect href="/" />;
}
