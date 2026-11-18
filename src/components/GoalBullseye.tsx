import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, View } from 'react-native';
import { icon3d } from '../data/icons3d';

// Where the arrow's tip sits inside its image (it points down-left), measured from the Figma render.
const TIP_X = 0.02, TIP_Y = 0.95;

/**
 * A 3D bullseye (from the Figma icon sheet) with an arrow that flies in and lands dead centre, wobbles,
 * then does it again every few seconds. Used next to "Your goal".
 */
export function GoalBullseye({ size = 40 }: { size?: number }) {
  const fly = useRef(new Animated.Value(0)).current;   // 0 = off to the top-right, 1 = in the centre
  const wob = useRef(new Animated.Value(0)).current;   // the arrow's quiver after it lands
  const thud = useRef(new Animated.Value(0)).current;  // the board's little bounce
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(fly, { toValue: 0, duration: 0, useNativeDriver: true }),
      Animated.delay(500),
      Animated.timing(fly, { toValue: 1, duration: 380, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      Animated.parallel([
        Animated.sequence([
          Animated.timing(thud, { toValue: 1, duration: 90, useNativeDriver: true }),
          Animated.spring(thud, { toValue: 0, friction: 4, tension: 180, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(wob, { toValue: 1, duration: 60, useNativeDriver: true }),
          Animated.spring(wob, { toValue: 0, friction: 2.5, tension: 260, useNativeDriver: true }),
        ]),
      ]),
      Animated.delay(3600),
    ]));
    loop.start();
    return () => loop.stop();
  }, [fly, wob, thud]);

  const a = size * 0.72; // arrow image size
  const c = size / 2;    // bullseye centre
  return (
    <View style={{ width: size, height: size }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.Image source={icon3d('goal_target')} resizeMode="contain"
        style={{ width: size, height: size, transform: [{ scale: thud.interpolate({ inputRange: [0, 1], outputRange: [1, 0.92] }) }] }} />
      <Animated.View style={{ position: 'absolute', left: c - TIP_X * a, top: c - TIP_Y * a, width: a, height: a,
        opacity: fly.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 1] }),
        transform: [
          { translateX: fly.interpolate({ inputRange: [0, 1], outputRange: [size * 0.9, 0] }) },
          { translateY: fly.interpolate({ inputRange: [0, 1], outputRange: [-size * 0.9, 0] }) },
          // quiver around the tip: shift the pivot to the tip, rotate, shift back
          { translateX: -a * (0.5 - TIP_X) }, { translateY: a * (TIP_Y - 0.5) },
          { rotate: wob.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-7deg', '0deg', '7deg'] }) },
          { translateX: a * (0.5 - TIP_X) }, { translateY: -a * (TIP_Y - 0.5) },
        ] }}>
        <Image source={icon3d('goal_arrow')} resizeMode="contain" style={{ width: a, height: a }} />
      </Animated.View>
    </View>
  );
}
