import React from 'react';
import { Image, type ImageSourcePropType, Pressable, Text, View } from 'react-native';
import { C, F, TILE } from '../theme';
import { Seal } from './ui';

/**
 * The one tile used across Home: a light-grey rounded square holding a 3D object (or a small
 * animation), with the title and a quiet second line underneath — never crammed inside.
 */
export function Tile({ image, art, title, sub, eyebrow, badge, done, onPress, height = 128, imageSize = 92, label, tint }: {
  image?: ImageSourcePropType; art?: React.ReactNode; title: string; sub?: string; eyebrow?: string; badge?: React.ReactNode;
  done?: boolean; onPress?: () => void; height?: number; imageSize?: number; label?: string; tint?: string;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label ?? `${title}${sub ? `, ${sub}` : ''}${done ? ', done' : ''}`}>
      {({ pressed }) => (
        <View style={{ transform: [{ scale: pressed ? 0.97 : 1 }] }}>
          <View style={{ height, borderRadius: 22, backgroundColor: pressed ? '#EFEFF0' : tint ?? TILE, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <View style={{ opacity: done ? 0.4 : 1 }}>
              {art ?? (image ? <Image source={image} resizeMode="contain" style={{ width: imageSize, height: imageSize }} /> : null)}
            </View>
            {badge ? <View style={{ position: 'absolute', top: 10, left: 10 }}>{badge}</View> : null}
            {done ? <View style={{ position: 'absolute', right: 10, bottom: 10 }}><Seal size={26} /></View> : null}
          </View>
          {eyebrow ? <Text style={{ fontFamily: F.semibold, fontSize: 11, letterSpacing: 0.8, color: C.gray, marginTop: 10 }}>{eyebrow}</Text> : null}
          <Text numberOfLines={2} style={{ fontFamily: F.semibold, fontSize: 15, lineHeight: 20, color: done ? C.gray : C.ink, marginTop: eyebrow ? 2 : 10 }}>{title}</Text>
          {sub ? <Text numberOfLines={1} style={{ fontFamily: F.regular, fontSize: 13, color: C.gray2, marginTop: 2 }}>{sub}</Text> : null}
        </View>
      )}
    </Pressable>
  );
}

/** Section title used on every page: bold, roomy, sentence case. */
export function SectionTitle({ children, right, note }: { children: React.ReactNode; right?: React.ReactNode; note?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14, gap: 12 }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: F.bold, fontSize: 22, letterSpacing: -0.4, color: C.ink }}>{children}</Text>
        {note ? <Text style={{ fontFamily: F.regular, fontSize: 14, color: C.gray2, marginTop: 4 }}>{note}</Text> : null}
      </View>
      {right}
    </View>
  );
}
