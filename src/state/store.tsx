import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import rulesJson from '../engine/rules.json';
import { type CloudStatus, useCloud } from './cloud';
import { buildPlan, type Plan, type Profile, type Rules } from '../engine/planEngine';

export const rules = rulesJson as unknown as Rules;

export type LifeChange = { type: string; label: string; startsAt: string; endsAt: string | null };
type State = {
  answers: Record<string, any>;
  onboarded: boolean;
  done: Record<string, string[]>; // date → lever ids done that day
  lastWash: string | null;
  lifeChange: LifeChange | null;
  reminders: Record<string, boolean>;
  name: string;
};

const today = () => new Date().toISOString().slice(0, 10);
const initial: State = { answers: {}, onboarded: false, done: {}, lastWash: null, lifeChange: null, reminders: {}, name: 'Your name' };
const KEY = 'moi-state-v1';

const LENGTH_CM: Record<string, number> = { buzzed: 1, short: 8, chin: 20, shoulder: 35, 'mid-back': 50, waist: 70 };

export function profileFromAnswers(a: Record<string, any>): Profile {
  const noticed: string[] = (a.noticed ?? []).filter((x: string) => x !== 'none');
  return {
    goal: a.goal ?? 'repair',
    texture: a.texture ?? 'wavy',
    thickness: a.thickness ?? 'medium',
    porosity: a.porosity ?? 'normal',
    scalp: a.scalp ?? 'normal',
    chemical: a.chemical ?? 'none',
    heatUse: a.heatUse ?? 'weekly',
    length: a.length ?? 'shoulder',
    tightStyles: !!a.tightStyles,
    swims: !!a.swims,
    timeBudget: a.timeBudget ?? 15,
    washNow: a.washNow,
    noticed,
    prefersNatural: !!a.prefersNatural,
    // Estimated baseline until the first real scan
    baseline: { frizz: noticed.includes('frizz') ? 7 : 6, oiliness: a.scalp === 'oily' ? 7 : 5, buildup: a.scalp === 'flaky' ? 6 : 4, density: 65, lengthCm: LENGTH_CM[a.length] ?? 35 },
  };
}

type Ctx = State & {
  hydrated: boolean;
  cloud: CloudStatus;
  plan: Plan | null;
  todayKey: string;
  setAnswer: (id: string, v: any) => void;
  finishOnboarding: () => void;
  toggleDone: (id: string) => void;
  logWash: () => void;
  setLifeChange: (c: LifeChange | null) => void;
  setReminder: (id: string, on: boolean) => void;
  reset: () => void;
};
const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<State>(initial);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { AsyncStorage.getItem(KEY).then(v => { if (v) try { setS({ ...initial, ...JSON.parse(v) }); } catch {} setHydrated(true); }).catch(() => setHydrated(true)); }, []);
  useEffect(() => { if (hydrated) AsyncStorage.setItem(KEY, JSON.stringify(s)).catch(() => {}); }, [s, hydrated]);

  const cloud = useCloud(hydrated, { name: s.name, answers: s.answers, onboarded: s.onboarded, lastWash: s.lastWash, reminders: s.reminders });

  const plan = useMemo(() => (Object.keys(s.answers).length ? buildPlan(profileFromAnswers(s.answers), rules) : null), [s.answers]);
  const todayKey = today();
  const value: Ctx = {
    ...s, hydrated, cloud: cloud.status, plan, todayKey,
    setAnswer: (id, v) => setS(p => ({ ...p, answers: { ...p.answers, [id]: v } })),
    finishOnboarding: () => setS(p => ({ ...p, onboarded: true })),
    toggleDone: id => {
      const isDone = (s.done[todayKey] ?? []).includes(id);
      setS(p => { const d = p.done[todayKey] ?? []; return { ...p, done: { ...p.done, [todayKey]: d.includes(id) ? d.filter(x => x !== id) : [...d, id] } }; });
      cloud.setDone(id, todayKey, !isDone);
    },
    logWash: () => setS(p => ({ ...p, lastWash: todayKey })),
    setLifeChange: c => {
      setS(p => ({ ...p, lifeChange: c }));
      if (c) cloud.startChange(c); else cloud.endChanges(todayKey);
    },
    setReminder: (id, on) => setS(p => ({ ...p, reminders: { ...p.reminders, [id]: on } })),
    reset: () => setS({ ...initial }),
  };
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error('useStore outside provider');
  return c;
}

export const formatValue = (value: string | number, unit: string) => (unit ? `${value} ${unit}` : String(value));
