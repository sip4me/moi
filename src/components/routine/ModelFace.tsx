import React from 'react';
import { Image, Platform, View } from 'react-native';
import Svg, { Defs, Ellipse, FeGaussianBlur, Filter, G, Path } from 'react-native-svg';
import { hexToLab } from '../../lib/routine/color';
import { shadeOf } from '../../lib/routine/shade';
import type { Item } from '../../lib/routine/model';
import MARKS from '../../lib/routine/models.json';

/**
 * A generated model (fictional, one per skin tone) wearing the routine's actual shades, like virtual try-on:
 * each product's colour is blended onto the lips, cheeks, lids and lash line found by face landmarks,
 * so the skin's texture shows through. "Without" is the bare photo.
 */
const PHOTOS: Record<string, any> = {
  Fair: require('../../../assets/models/fair.jpg'), Light: require('../../../assets/models/light.jpg'), Medium: require('../../../assets/models/medium.jpg'),
  Tan: require('../../../assets/models/tan.jpg'), Deep: require('../../../assets/models/deep.jpg'), Rich: require('../../../assets/models/rich.jpg'),
};
type P = [number, number];
const W = 512, H = 640;
const path = (pts: P[], close = true) => `M${pts.map(p => p.join(' ')).join(' L')}${close ? ' Z' : ''}`;
const smooth = (pts: P[]) => pts.length < 3 ? path(pts, false) : `M${pts[0].join(' ')} ` + pts.slice(1, -1).map((p, i) => { const n = pts[i + 2]; return `Q${p[0]} ${p[1]} ${(p[0] + n[0]) / 2} ${(p[1] + n[1]) / 2}`; }).join(' ') + ` L${pts[pts.length - 1].join(' ')}`;
const mid = (a: P, b: P, t = 0.5): P => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

export function ModelFace({ tone, items, on, width = 240 }: { tone?: string; items: Item[]; on: boolean; width?: number }) {
  const key = tone && PHOTOS[tone] ? tone : 'Medium';
  const m = (MARKS as unknown as Record<string, P[]>)[key.toLowerCase()];
  const height = (width * H) / W;
  const color = (...cats: string[]) => { const i = items.find(x => cats.includes(x.category)); return i ? shadeOf(i) : undefined; };
  // The lip colour comes from the lipstick, not the liner, when the routine has both.
  const lipItem = items.find(i => i.category === 'lips' && !/liner|pencil/i.test(i.name)) ?? items.find(i => i.category === 'lips');
  const lip = lipItem ? shadeOf(lipItem) : undefined, gloss = items.some(i => i.category === 'lip_gloss') ? color('lip_gloss') : undefined;
  const liner = color('eyeliner'), lash = color('mascara'), shadow = color('eyeshadow'), blush = color('blush'), bronze = color('bronzer'), glow = items.some(i => i.category === 'highlighter');
  const lipColor = lip ?? (gloss && hexToLab(gloss)[0] < 85 ? gloss : undefined);
  const dark = (hex?: string) => (hex ? hexToLab(hex)[0] < 45 : false);

  // Landmarks (68-point): jaw 0–16, brows 17–26, eyes 36–41 / 42–47, lips outer 48–59, inner 60–67.
  const outer = m.slice(48, 60), inner = m.slice(60, 68);
  const upperR = [m[36], m[37], m[38], m[39]], upperL = [m[42], m[43], m[44], m[45]];
  const lowerR = [m[39], m[40], m[41], m[36]], lowerL = [m[45], m[46], m[47], m[42]];
  // Lids: from the lash line up about 40% of the way to the brow.
  const lid = (eye: P[], brow: P[]) => [...eye, ...[...brow].reverse().map((b, i) => mid([...eye].reverse()[i] ?? eye[0], b, 0.45) as P)];
  const lidR = lid(upperR, [m[17], m[19], m[20], m[21]]), lidL = lid(upperL, [m[22], m[23], m[24], m[26]]);
  // Cheeks: between the eye's lower edge and the mouth corner, pushed toward the face's edge.
  const cheekR = mid(mid(m[41], m[48]), m[2], 0.35), cheekL = mid(mid(m[46], m[54]), m[14], 0.35);
  const eyeW = m[39][0] - m[36][0];
  const wing = (outerPt: P, dir: number): P => [outerPt[0] + dir * eyeW * 0.28, outerPt[1] - eyeW * 0.16];

  const blend = (mode: string) => (Platform.OS === 'web' ? ({ mixBlendMode: mode } as object) : {});
  const layer = { position: 'absolute' as const, left: 0, top: 0, width, height };
  return (
    <View style={{ width, height, borderRadius: 22, overflow: 'hidden', backgroundColor: '#D9D6D2' }} accessibilityRole="image" accessibilityLabel={on ? 'Model wearing these products' : 'Model without makeup'}>
      <Image source={PHOTOS[key]} style={{ width, height }} resizeMode="cover" />
      {on ? (
        <>
          <Svg viewBox={`0 0 ${W} ${H}`} style={[layer, blend('multiply')]} pointerEvents="none">
            <Defs>
              <Filter id="soft" filterUnits="userSpaceOnUse" x="0" y="0" width="{W}" height="{H}"><FeGaussianBlur stdDeviation="16" /></Filter>
              <Filter id="mid" filterUnits="userSpaceOnUse" x="0" y="0" width="{W}" height="{H}"><FeGaussianBlur stdDeviation="6" /></Filter>
              <Filter id="edge" filterUnits="userSpaceOnUse" x="0" y="0" width="{W}" height="{H}"><FeGaussianBlur stdDeviation="1.4" /></Filter>
            </Defs>
            {bronze ? <G filter="url(#soft)" opacity={0.35}>
              <Ellipse cx={mid(m[2], cheekR, 0.25)[0]} cy={mid(m[2], cheekR, 0.25)[1] + eyeW * 0.25} rx={eyeW * 0.55} ry={eyeW * 0.3} fill={bronze} />
              <Ellipse cx={mid(m[14], cheekL, 0.25)[0]} cy={mid(m[14], cheekL, 0.25)[1] + eyeW * 0.25} rx={eyeW * 0.55} ry={eyeW * 0.3} fill={bronze} />
            </G> : null}
            {blush ? <G filter="url(#soft)" opacity={0.5}>
              <Ellipse cx={cheekR[0]} cy={cheekR[1]} rx={eyeW * 0.62} ry={eyeW * 0.42} fill={blush} />
              <Ellipse cx={cheekL[0]} cy={cheekL[1]} rx={eyeW * 0.62} ry={eyeW * 0.42} fill={blush} />
            </G> : null}
            {shadow ? <G filter="url(#mid)" opacity={0.6}><Path d={path(lidR)} fill={shadow} /><Path d={path(lidL)} fill={shadow} /></G> : null}
            {lipColor ? <G filter="url(#edge)" opacity={0.35}><Path d={`${path(outer)} ${path(inner)}`} fill={lipColor} fillRule="evenodd" /></G> : null}
            {lip && items.filter(i => i.category === 'lips').length > 1 ? <G filter="url(#edge)" opacity={0.6}><Path d={path(outer)} stroke={lip} strokeWidth={3} fill="none" /></G> : null}
            {liner ? <G filter="url(#edge)" opacity={0.9}>
              <Path d={smooth([...upperR, wing(m[36], -1)].reverse())} stroke={liner} strokeWidth={3.2} fill="none" strokeLinecap="round" />
              <Path d={smooth([...upperL, wing(m[45], 1)])} stroke={liner} strokeWidth={3.2} fill="none" strokeLinecap="round" />
              <G filter="url(#mid)" opacity={0.7}><Path d={smooth(lowerR)} stroke={liner} strokeWidth={4} fill="none" /><Path d={smooth(lowerL)} stroke={liner} strokeWidth={4} fill="none" /></G>
            </G> : null}
            {lash ? <G filter="url(#edge)" opacity={0.75}><Path d={smooth(upperR)} stroke={lash} strokeWidth={2.4} fill="none" /><Path d={smooth(upperL)} stroke={lash} strokeWidth={2.4} fill="none" /></G> : null}
          </Svg>
          {/* Lipstick sits on top of the lips (normal blend) so its real colour shows; the multiply pass above keeps the lip texture. */}
          {lipColor ? <Svg viewBox={`0 0 ${W} ${H}`} style={layer} pointerEvents="none">
            <Defs><Filter id="lipedge" filterUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}><FeGaussianBlur stdDeviation="1.6" /></Filter></Defs>
            <G filter="url(#lipedge)" opacity={0.55}><Path d={`${path(outer)} ${path(inner)}`} fill={lipColor} fillRule="evenodd" /></G>
          </Svg> : null}
          <Svg viewBox={`0 0 ${W} ${H}`} style={[layer, blend('screen')]} pointerEvents="none">
            <Defs><Filter id="shine" filterUnits="userSpaceOnUse" x="0" y="0" width="{W}" height="{H}"><FeGaussianBlur stdDeviation="5" /></Filter><Filter id="glowf" filterUnits="userSpaceOnUse" x="0" y="0" width="{W}" height="{H}"><FeGaussianBlur stdDeviation="12" /></Filter></Defs>
            {gloss ? <G filter="url(#shine)" opacity={0.55}><Ellipse cx={(m[57][0] + m[66][0]) / 2} cy={(m[57][1] + m[66][1]) / 2} rx={eyeW * 0.35} ry={eyeW * 0.09} fill="#FFFFFF" /></G> : null}
            {glow ? <G filter="url(#glowf)" opacity={0.35}>
              <Ellipse cx={mid(cheekR, m[36], 0.45)[0]} cy={mid(cheekR, m[36], 0.45)[1]} rx={eyeW * 0.35} ry={eyeW * 0.16} fill="#FFF3E0" />
              <Ellipse cx={mid(cheekL, m[45], 0.45)[0]} cy={mid(cheekL, m[45], 0.45)[1]} rx={eyeW * 0.35} ry={eyeW * 0.16} fill="#FFF3E0" />
              <Ellipse cx={m[28][0]} cy={m[28][1]} rx={eyeW * 0.08} ry={eyeW * 0.4} fill="#FFF3E0" />
            </G> : null}
          </Svg>
        </>
      ) : null}
    </View>
  );
}
