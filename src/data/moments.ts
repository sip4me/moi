// "Moments": a short, timely nudge on Home with its own animation.
// - Night (7 PM–5 AM): tie hair into a loose pineapple, for hair long enough to gather.
// - Wash day, before washing: pre-wash oil, when the routine starts with it.
// - Active people with a wash day today or tomorrow: oil the ends before a workout.
import type { Plan, Profile } from '../engine/planEngine';

export type MomentKind = 'pineapple' | 'oil-wash' | 'oil-workout';
export type Moment = { kind: MomentKind; eyebrow: string; title: string; body: string; cta: string; doneId: string };

const SHORT = new Set(['buzzed', 'short']);

export function currentMoment({ hour, plan, profile, washToday, washTomorrow, washedToday, doneToday }: {
  hour: number; plan: Plan; profile: Profile; washToday: boolean; washTomorrow: boolean; washedToday: boolean; doneToday: string[];
}): Moment | null {
  const night = hour >= 19 || hour < 5;
  const has = (id: string) => doneToday.includes(id);

  if (night) {
    if (SHORT.has(profile.length) || has('night_braid')) return null;
    const curly = profile.texture === 'curly' || profile.texture === 'coily';
    return {
      kind: 'pineapple', eyebrow: 'TONIGHT', title: 'Pineapple before bed',
      body: curly
        ? 'Gather your curls loosely on top of your head with a soft scrunchie. They’ll keep their shape and won’t get crushed on the pillow.'
        : 'Loosely gather your hair on top of your head with a soft scrunchie, so your ends don’t rub and tangle on the pillow overnight.',
      cta: 'Done for tonight', doneId: 'night_braid',
    };
  }

  const oilInRoutine = plan.washRoutine?.steps.some(s => s.id === 'pre_wash_oil');
  if (washToday && !washedToday && oilInRoutine && !has('wash:pre_wash_oil')) {
    return {
      kind: 'oil-wash', eyebrow: 'BEFORE YOU WASH', title: 'Start with pre-wash oil',
      body: 'Work a little oil through your lengths and ends, then wait 20 minutes before you shampoo. It protects your hair from drying out in the wash.',
      cta: 'Oiled ✓', doneId: 'wash:pre_wash_oil',
    };
  }

  const active = (profile.lifestyle ?? []).includes('sports');
  if (active && (washTomorrow || (washToday && !washedToday)) && !has('pre_workout_oil') && !SHORT.has(profile.length)) {
    return {
      kind: 'oil-workout', eyebrow: washToday ? 'WORKOUT, THEN WASH DAY' : 'WORKING OUT BEFORE WASH DAY?', title: 'Oil your ends first',
      body: 'Smooth a few drops of oil over your ends and tie your hair up loosely before you train. Sweat and friction won’t dry them out, and it all washes out on wash day.',
      cta: 'Done', doneId: 'pre_workout_oil',
    };
  }
  return null;
}
