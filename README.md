# Moi

Your daily hair plan. Expo (SDK 58) app that runs on iOS, Android and the web from one codebase.

## Run it

```bash
npm ci
cp .env.example .env        # fill in the publishable key
npx expo start              # phone (Expo Go) or press w for web
npm run build:web           # static web build in dist/ (what Vercel deploys)
```

## Layout

| Path | What lives there |
| --- | --- |
| `src/app/` | Screens. Each file is a route (Expo Router): `onboarding/`, `(tabs)/`, `why/[id]`, `change`, `reminders`. |
| `src/components/ui.tsx` | Shared building blocks: Screen, Button, OptionRow, RecCard, Logo, etc. |
| `src/engine/` | The plan engine. `rules.json` is generated from the "Moi plan rules" sheet; `planEngine.ts` turns answers into a daily plan. |
| `src/state/store.tsx` | App state, saved on the device first. |
| `src/state/cloud.ts` | Mirrors that state to Supabase in the background. |
| `src/lib/supabase.ts` | Supabase client and quiet anonymous sign-in. |
| `scripts/pwa-head.js` | Adds the manifest and home-screen icon tags to the web build. |

## Backend

Supabase project `moi` (`nqbfsieploomjefpakfm`). Tables: `profiles`, `done_log`, `life_changes`, `push_tokens`, `notification_log`. Row-level security on every table, so each person can only read and write their own rows.
