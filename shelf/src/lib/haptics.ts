import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Light taps and a success buzz, everywhere the platform allows:
 *  - iOS/Android app: the system haptic engine (expo-haptics).
 *  - Android browsers: the Vibration API.
 *  - iPhone Safari / home-screen app: Safari has no Vibration API, but toggling a hidden
 *    `<input type="checkbox" switch>` (Safari 17.4+) plays the system tap. It only works
 *    inside a real tap, so call these from press handlers.
 * Everything else (desktop) does nothing.
 */
type Kind = 'tap' | 'select' | 'success';

let iosSwitch: HTMLLabelElement | null = null;
function iosTap() {
  if (typeof document === 'undefined') return;
  if (!iosSwitch) {
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.setAttribute('switch', '');
    input.id = 'moi-haptic';
    input.style.display = 'none';
    const label = document.createElement('label');
    label.htmlFor = 'moi-haptic';
    label.style.display = 'none';
    document.body.append(input, label);
    iosSwitch = label;
  }
  iosSwitch.click();
}

const isIOSWeb = () => typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

export function haptic(kind: Kind = 'tap') {
  try {
    if (Platform.OS !== 'web') {
      if (kind === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else if (kind === 'select') Haptics.selectionAsync();
      else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }
    if (isIOSWeb()) {
      iosTap();
      if (kind === 'success') setTimeout(iosTap, 120);
      return;
    }
    navigator.vibrate?.(kind === 'success' ? [12, 60, 18] : kind === 'select' ? 6 : 10);
  } catch {
    // Haptics are a nicety; never let them break a tap.
  }
}
