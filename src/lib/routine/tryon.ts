/**
 * Try-on (web): finds the face with MediaPipe Face Mesh (468 points, self-hosted in /mp, runs on the device)
 * and paints makeup onto the person's own photo with a 2D canvas. The photo never leaves the device.
 *
 * Painting: each product is a shape (lips, lids, cheeks...) filled with the product's shade, softened with a
 * shadow blur (works in every browser, unlike ctx.filter), then blended onto the photo:
 *   multiply  = pigment that darkens (lips, liner, shadow, blush, bronzer)
 *   source-over at low alpha = opaque colour (lipstick)
 *   screen    = light (gloss, highlighter)
 */

export type Pt = [number, number];
export type Layers = {
  lips?: string; lipGloss?: boolean;
  blush?: string; bronzer?: string; shadow?: string; liner?: string; wing?: boolean; highlight?: boolean;
};

// Face Mesh indices.
const LIP_OUT = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185];
const LIP_IN = [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 415, 310, 311, 312, 13, 82, 81, 80, 191];
// Upper lash line from outer to inner corner, and the brow's lower edge from outer to inner.
const EYES = [
  { lash: [33, 246, 161, 160, 159, 158, 157, 173, 133], brow: [46, 53, 52, 65, 55] },
  { lash: [263, 466, 388, 387, 386, 385, 384, 398, 362], brow: [276, 283, 282, 295, 285] },
];

declare global { interface Window { FaceMesh?: any } }
let mesh: any = null;
let pending: ((pts: Pt[] | null) => void) | null = null;

function loadScript(src: string) {
  return new Promise<void>((ok, bad) => {
    if (document.querySelector(`script[src="${src}"]`)) return ok();
    const s = document.createElement('script');
    s.src = src; s.crossOrigin = 'anonymous'; s.onload = () => ok(); s.onerror = () => bad(new Error('load ' + src));
    document.head.appendChild(s);
  });
}

/** 468 face points in image pixels, or null when no face is found. */
export async function findFace(img: HTMLImageElement | HTMLCanvasElement): Promise<Pt[] | null> {
  if (!mesh) {
    await loadScript('/mp/face_mesh.js');
    mesh = new window.FaceMesh!({ locateFile: (f: string) => `/mp/${f}` });
    mesh.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
    mesh.onResults((r: any) => {
      const lm = r.multiFaceLandmarks?.[0];
      const w = (r.image as HTMLCanvasElement).width, h = (r.image as HTMLCanvasElement).height;
      pending?.(lm ? lm.map((p: { x: number; y: number }) => [p.x * w, p.y * h] as Pt) : null);
      pending = null;
    });
    await mesh.initialize();
  }
  return new Promise(ok => { pending = ok; mesh.send({ image: img }); });
}

const mid = (a: Pt, b: Pt, t = 0.5): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);
/** Point at fraction t along a polyline. */
function along(line: Pt[], t: number): Pt {
  const segs = line.slice(1).map((p, i) => dist(line[i], p));
  let d = t * segs.reduce((a, b) => a + b, 0);
  for (let i = 0; i < segs.length; i++) { if (d <= segs[i] || i === segs.length - 1) return mid(line[i], line[i + 1], segs[i] ? Math.min(1, d / segs[i]) : 0); d -= segs[i]; }
  return line[line.length - 1];
}

/** Smooth closed curve through points (midpoint quadratics). */
function smooth(o: CanvasRenderingContext2D, ps: Pt[], dx: number) {
  const n = ps.length;
  const m0 = mid(ps[n - 1], ps[0]);
  o.moveTo(m0[0] + dx, m0[1]);
  for (let i = 0; i < n; i++) { const p = ps[i], m = mid(p, ps[(i + 1) % n]); o.quadraticCurveTo(p[0] + dx, p[1], m[0] + dx, m[1]); }
  o.closePath();
}

type Paint = { color: string; alpha: number; blur: number; mode: GlobalCompositeOperation };

/** Draws one softened shape onto the photo. The shape is drawn off to the side and only its blurred shadow lands. */
function paint(ctx: CanvasRenderingContext2D, shape: (o: CanvasRenderingContext2D, dx: number) => void, p: Paint, stroke?: number) {
  const { width: W, height: H } = ctx.canvas;
  const off = document.createElement('canvas'); off.width = W; off.height = H;
  const o = off.getContext('2d')!;
  const dx = -W * 2;
  o.shadowColor = p.color; o.shadowBlur = p.blur; o.shadowOffsetX = -dx;
  o.fillStyle = p.color; o.strokeStyle = p.color;
  o.beginPath(); shape(o, dx);
  if (stroke) { o.lineWidth = stroke; o.lineCap = 'round'; o.lineJoin = 'round'; o.stroke(); } else o.fill('evenodd');
  ctx.save(); ctx.globalCompositeOperation = p.mode; ctx.globalAlpha = p.alpha; ctx.drawImage(off, 0, 0); ctx.restore();
}

/** Photo plus makeup. strength 0..1 scales every layer (light / medium / full). */
export function render(ctx: CanvasRenderingContext2D, img: CanvasImageSource, pts: Pt[] | null, L: Layers, on: boolean, strength = 0.7) {
  const { width: W, height: H } = ctx.canvas;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(img, 0, 0, W, H);
  if (!on || !pts) return;
  const P = (i: number) => pts[i];
  const fw = dist(P(234), P(454)); // face width: every size is relative to it
  const k = strength;

  // Eyeshadow: lid from the lash line up to just under the brow, deeper at the outer corner.
  if (L.shadow) for (const e of EYES) {
    const lash = e.lash.map(P), brow = e.brow.map(P);
    const crease = lash.map((p, i) => mid(p, along(brow, i / (lash.length - 1)), 0.55));
    paint(ctx, (o, dx) => smooth(o, [...lash, ...crease.reverse()], dx), { color: L.shadow, alpha: 0.55 * k, blur: fw * 0.025, mode: 'multiply' });
    paint(ctx, (o, dx) => { const c = mid(lash[1], crease[crease.length - 2]); o.ellipse(c[0] + dx, c[1], fw * 0.04, fw * 0.025, 0, 0, Math.PI * 2); }, { color: L.shadow, alpha: 0.35 * k, blur: fw * 0.03, mode: 'multiply' });
  }

  // Eyeliner along the upper lash line, with an optional wing from the outer corner.
  if (L.liner) for (const e of EYES) {
    const lash = e.lash.map(P);
    paint(ctx, (o, dx) => { o.moveTo(lash[0][0] + dx, lash[0][1]); lash.slice(1).forEach(p => o.lineTo(p[0] + dx, p[1])); }, { color: L.liner, alpha: 0.85 * k, blur: fw * 0.004, mode: 'multiply' }, fw * 0.008);
    if (L.wing) {
      const outer = lash[0], inner = lash[lash.length - 1];
      const ux = (outer[0] - inner[0]) / dist(outer, inner), uy = (outer[1] - inner[1]) / dist(outer, inner);
      const a = -0.45 * Math.sign(ux || 1); // tilt up toward the temple
      const wx = ux * Math.cos(a) - uy * Math.sin(a), wy = ux * Math.sin(a) + uy * Math.cos(a);
      const tip: Pt = [outer[0] + wx * fw * 0.06, outer[1] + wy * fw * 0.06];
      paint(ctx, (o, dx) => { o.moveTo(lash[2][0] + dx, lash[2][1]); o.lineTo(tip[0] + dx, tip[1]); o.lineTo(outer[0] + dx, outer[1] + fw * 0.004); o.closePath(); }, { color: L.liner, alpha: 0.85 * k, blur: fw * 0.003, mode: 'multiply' });
    }
  }

  // Bronzer / contour: a soft stroke under the cheekbone, from the ear toward the mouth corner.
  if (L.bronzer) for (const [ear, corner] of [[234, 61], [454, 291]] as const) {
    const a = P(ear), b = mid(P(ear), P(corner), 0.55), c = mid(a, b);
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    paint(ctx, (o, dx) => o.ellipse(c[0] + dx, c[1], dist(a, b) * 0.55, fw * 0.045, ang, 0, Math.PI * 2), { color: L.bronzer, alpha: 0.45 * k, blur: fw * 0.05, mode: 'multiply' });
  }

  // Blush on the apples of the cheeks.
  if (L.blush) for (const [a, b] of [[50, 117], [280, 346]] as const) {
    const c = mid(P(a), P(b), 0.55);
    paint(ctx, (o, dx) => o.arc(c[0] + dx, c[1], fw * 0.08, 0, Math.PI * 2), { color: L.blush, alpha: 0.42 * k, blur: fw * 0.08, mode: 'multiply' });
  }

  // Highlighter on the cheekbone tops and the nose bridge.
  if (L.highlight) {
    for (const [a, b] of [[116, 117], [345, 346]] as const) {
      const c = mid(P(a), P(b));
      paint(ctx, (o, dx) => o.ellipse(c[0] + dx, c[1] - fw * 0.01, fw * 0.06, fw * 0.022, 0, 0, Math.PI * 2), { color: '#FFF4E8', alpha: 0.35 * k, blur: fw * 0.03, mode: 'screen' });
    }
    paint(ctx, (o, dx) => { const t = P(6), b = P(4); o.moveTo(t[0] + dx, t[1]); o.lineTo(b[0] + dx, b[1]); }, { color: '#FFF4E8', alpha: 0.25 * k, blur: fw * 0.02, mode: 'screen' }, fw * 0.02);
  }

  // Lips last: the outer lip line minus the open mouth, pigment then colour, then gloss.
  if (L.lips) {
    const outer = LIP_OUT.map(P), inner = LIP_IN.map(P);
    const lips = (o: CanvasRenderingContext2D, dx: number) => { smooth(o, outer, dx); smooth(o, inner, dx); };
    paint(ctx, lips, { color: L.lips, alpha: 0.5 * k, blur: fw * 0.006, mode: 'multiply' });
    paint(ctx, lips, { color: L.lips, alpha: 0.45 * k, blur: fw * 0.006, mode: 'source-over' });
    if (L.lipGloss) {
      const c = mid(P(14), P(17), 0.45);
      paint(ctx, (o, dx) => o.ellipse(c[0] + dx, c[1], dist(P(61), P(291)) * 0.18, fw * 0.012, 0, 0, Math.PI * 2), { color: '#FFFFFF', alpha: 0.55 * k, blur: fw * 0.012, mode: 'screen' });
    }
  }
}
