import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import rulesJson from '../engine/rules.json';
import { wasRemembered } from '../lib/supabase';
import { type Account, type CloudStatus, type Snapshot, useCloud } from './cloud';
import { buildPlan, type Goal, type Plan, type Profile, type Rules } from '../engine/planEngine';

export const rules = rulesJson as unknown as Rules;

export type ShelfItem = { id: string; name: string; label: string; addedAt: string };
export type Metrics = { density: number; thickness: string; porosity: string; frizz: number; oiliness: string; buildup: string };
export type ScanRecord = { at: string; angles: number; metrics: Metrics; edited: boolean };

export type LifeChange = { type: string; label: string; startsAt: string; endsAt: string | null };
type State = {
  answers: Record<string, any>;
  onboarded: boolean;
  done: Record<string, string[]>; // date → lever ids done that day
  lastWash: string | null;
  lifeChange: LifeChange | null;
  reminders: Record<string, boolean>;
  name: string;
  shelf: ShelfItem[];
  scans: ScanRecord[];
};

const today = () => new Date().toISOString().slice(0, 10);
const initial: State = { answers: {}, onboarded: false, done: {}, lastWash: null, lifeChange: null, reminders: {}, name: 'Your name', shelf: [], scans: [] };
const KEY = 'moi-state-v1';

const LENGTH_CM: Record<string, number> = { buzzed: 1, short: 8, chin: 20, shoulder: 35, 'mid-back': 50, waist: 70 };

const TIGHT_STYLES = ['braids', 'locs', 'twists', 'ponytail', 'wigs', 'slick_back'];
const THINNING_SIGNS = ['receding', 'thinning_crown', 'wider_part'];
const list = (v: unknown): string[] => (Array.isArray(v) ? v.filter(x => x !== 'none') : []);

/** Turns raw onboarding answers into the engine's Profile. Every derived field is spelled out here. */
export function profileFromAnswers(a: Record<string, any>): Profile {
  const picked: Goal[] = Array.isArray(a.goal) ? a.goal : a.goal ? [a.goal] : [];
  const goals: Goal[] = picked.length ? picked : ['repair'];
  const lifestyle = list(a.lifestyle);
  const styles = list(a.hairstyles);
  const raw = list(a.noticed);
  // The engine's thinning rules key off one signal; the screen asks about three specific signs.
  const noticed = raw.some(x => THINNING_SIGNS.includes(x)) ? [...raw, 'pattern_thinning'] : raw;
  const oily = a.scalp === 'oily' || raw.includes('oily_roots');
  const flaky = a.scalp === 'flaky' || raw.includes('flakes') || raw.includes('buildup');
  return {
    goal: goals[0],
    goals,
    texture: a.texture ?? 'wavy',
    thickness: a.thickness ?? 'medium',
    porosity: a.porosity ?? 'normal',
    scalp: a.scalp ?? 'normal',
    chemical: a.chemical ?? 'none',
    heatUse: a.heatUse ?? (styles.includes('heat_styled') ? 'weekly' : 'none'),
    length: a.length ?? 'shoulder',
    tightStyles: styles.some(x => TIGHT_STYLES.includes(x)),
    lifestyle,
    busy: lifestyle.some(x => x === 'demanding_job' || x === 'student' || x === 'caregiver'),
    timeBudget: a.timeBudget ?? 15,
    washNow: a.washNow,
    noticed,
    prefersNatural: !!a.prefersNatural,
    targetValue: typeof a.target === 'number' ? a.target : undefined,
    // Estimated baseline until the first real scan
    baseline: { frizz: noticed.includes('frizz') ? 7 : 6, oiliness: oily ? 7 : 5, buildup: flaky ? 6 : 4, density: 65, lengthCm: LENGTH_CM[a.length] ?? 35 },
  };
}

type Ctx = State & {
  hydrated: boolean;
  cloud: CloudStatus;
  account: Account | null;
  syncNow: () => Promise<void>;
  setName: (name: string) => void;
  addToShelf: (item: Omit<ShelfItem, 'id' | 'addedAt'>) => void;
  removeFromShelf: (id: string) => void;
  addScan: (scan: ScanRecord) => void;
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
  useEffect(() => {
    // "Keep me signed in" off means every launch starts fresh, so nothing personal is left on the device.
    Promise.all([AsyncStorage.getItem(KEY), wasRemembered()])
      .then(([v, remembered]) => { if (v && remembered) try { setS({ ...initial, ...JSON.parse(v) }); } catch {} })
      .finally(() => setHydrated(true));
  }, []);
  useEffect(() => { if (hydrated) AsyncStorage.setItem(KEY, JSON.stringify(s)).catch(() => {}); }, [s, hydrated]);

  const applyRemote = useCallback((r: Snapshot) => setS(p => ({ ...p, ...r })), []);
  const cloud = useCloud(hydrated, { name: s.name, answers: s.answers, onboarded: s.onboarded, lastWash: s.lastWash, reminders: s.reminders }, applyRemote);

  const plan = useMemo(() => (Object.keys(s.answers).length ? buildPlan(profileFromAnswers(s.answers), rules) : null), [s.answers]);
  const todayKey = today();
  const value: Ctx = {
    ...s, hydrated, cloud: cloud.status, account: cloud.account, syncNow: cloud.syncNow, plan, todayKey,
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
    setName: name => setS(p => ({ ...p, name })),
    addToShelf: item => setS(p => ({ ...p, shelf: [{ ...item, id: String(Date.now()), addedAt: todayKey }, ...p.shelf] })),
    removeFromShelf: id => setS(p => ({ ...p, shelf: p.shelf.filter(x => x.id !== id) })),
    addScan: scan => setS(p => ({ ...p, scans: [scan, ...p.scans].slice(0, 52) })),
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
