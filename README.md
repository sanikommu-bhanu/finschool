# Smart School FinTech

A mobile-first, glassmorphic school finance app — React 19, Vite, TypeScript, Firebase
(Auth + Firestore + Storage), TanStack Query, Zustand, React Hook Form + Zod, Recharts,
React Leaflet, jsPDF, and a Grok (xAI) AI assistant. All services used are free-tier.

The UI/UX (colors, layout, spacing, animation) is untouched from the original design —
every step of this build only wired real backend behavior behind the existing screens.

## Status: feature-complete (Steps 1–13)

| # | Area | What's real |
|---|------|-------------|
| 1 | Foundation | Design system, routing, auth guards, dark mode |
| 2–3 | Admin | Student / Teacher / Parent CRUD → Firestore |
| 4 | Accountant | Fee collection, payment simulator (UPI/Card/Cash), PDF receipts |
| 5–6 | Parent / Student | Live fees, receipts, attendance, transport status, Digital ID |
| 7 | Teacher | Attendance, assignments, announcements, student list, fee reminders |
| 8 | Transport | Vehicles, drivers, routes + live map (Leaflet/OSM), maintenance |
| 9 | QR | Generate (student ID + receipts), camera scan (jsQR) + manual fallback |
| 10 | Reports | Monthly/yearly/class-wise/revenue-wise, PDF + CSV export |
| 11 | Notifications | Real-time Firestore (onSnapshot), unread badge, mark-read, delete |
| 12 | AI Assistant | Grok chat: revenue insights, fee prediction, reminders, natural-language search over live Firestore aggregates |
| 13 | Offline + security | Firestore offline persistence + online/offline banner; per-collection Firestore security rules |

**Known gap:** `Messages` and global `Search` still render from local mock data
(`src/services/mockData.ts`). A real threaded-messaging backend wasn't part of the
numbered build plan and would need its own data model (threads, participants,
read-receipts) — flagged here rather than silently left half-wired. Everything else
listed above reads and writes real Firestore data.

## Quick start

```bash
npm install
cp .env.example .env      # fill in your Firebase + (optional) Grok keys — see below
npm run dev
```

Open the printed local URL and use your browser's device toolbar (390–430px) for the
intended mobile-first view.

```bash
npm run build     # type-check + production build
npm run lint       # eslint
npm run preview    # serve the production build locally
```

> This sandbox has no network access, so `npm install` / `npm run build` were not
> re-verified end-to-end after the Step 13 changes. Please run `npm run build` locally
> right after unzipping and share any TypeScript errors — they're fast to fix.

## Firebase setup guide

1. Go to the [Firebase Console](https://console.firebase.google.com) → **Add project** (the free Spark plan is enough).
2. **Authentication** → Sign-in method → enable **Google**.
3. **Firestore Database** → Create database → start in **test mode** (we lock it down with `firestore.rules` before going live — see below).
4. **Storage** → Get started (default rules are fine to start; `storage.rules` in this repo tightens it).
5. Project settings → General → "Your apps" → Add a **Web app** → copy the config values into `.env` (see `.env.example`).
6. Install the Firebase CLI if you don't have it: `npm install -g firebase-tools`, then `firebase login`.
7. From the project root: `firebase init` (select Firestore + Storage, point to the existing `firestore.rules`, `firestore.indexes.json`, `storage.rules` in this repo — don't overwrite them), then:
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes,storage
   ```
8. (Optional, for the AI Assistant) Get a free key at [console.x.ai](https://console.x.ai) and set `VITE_GROK_API_KEY` in `.env`. Without it, the AI Assistant screen shows a "no API key yet" banner but the rest of the app works normally.

## Environment variables

See `.env.example` for the full list (Firebase web config + optional Grok key/model
override + optional local-emulator flag). Nothing is committed with real values.

## Deployment guide

Any static host works since this is a Vite SPA with no server component:

```bash
npm run build        # outputs to dist/
```

- **Firebase Hosting** (free, pairs naturally with the rest of the stack):
  ```bash
  firebase init hosting   # public directory: dist, configure as single-page app: yes
  firebase deploy --only hosting
  ```
- **Vercel / Netlify**: connect the repo, build command `npm run build`, output directory `dist`, and add the same environment variables from `.env` in the host's dashboard.

Remember to add your deployed domain to Firebase Authentication → Settings →
Authorized domains, or Google Sign-In will be rejected.

## Project structure

```
src/
  components/    # ui/ (glass cards, buttons, offline banner...), layout/ (nav, topbar), charts/
  layouts/        # RoleLayout (bottom-nav shell), RequireAuth (route guards)
  pages/          # admin/, accountant/, parent/, student/, teacher/, transport/, shared/
  hooks/          # one hook per Firestore-backed feature (useStudents, useNotifications, ...)
  services/       # Firestore CRUD per collection + grokService, reports, receiptPdf
  schemas/        # Zod schemas + inferred types, one per form/collection
  store/          # Zustand: authStore, themeStore
  lib/            # firebase.ts (SDK init + offline persistence), receiptPdf, reportPdf, csv, timeAgo
  constants/      # roles.ts, images.ts
  types/          # shared TypeScript types
firestore.rules           # per-collection security rules
firestore.indexes.json    # composite indexes required by the app's queries
storage.rules              # Storage security rules
```

## Design system

- Palette: blush/pastel pink, rose, cream, peach, soft lavender — `tailwind.config.js`
- Glass surfaces: `.glass`, `.glass-card`, `.glass-pill`, `.glass-input` in `src/index.css`
- Dark mode via `useThemeStore`, applied through the `dark` class on `<html>`
- Fonts: Fraunces (display/headings) + Plus Jakarta Sans (body), via Google Fonts in `index.html`

## Auth

Google Sign-In only, via Firebase Authentication. Role is stored on the user's
`users/{uid}` doc and set once at first login (Role Select screen); `RequireAuth` /
`RequireAccount` route guards enforce it everywhere.

## Offline behavior

Firestore is initialized with `persistentLocalCache` (multi-tab) in `src/lib/firebase.ts`,
so reads are cached and writes queue locally when the network drops, then replay
automatically on reconnect — no data is lost. `useOnlineStatus` + `OfflineBanner`
surface a small "you're offline" / "back online, syncing…" pill globally without
touching any existing screen's layout.

## Security rules

`firestore.rules` is per-collection rather than one broad catch-all:

- `users`, `students`: existing guardian/self-read rules, staff-managed writes
- `teachers`, `parents`: staff-managed, each person can read (not write) their own doc
- `classes`, `attendance`, `assignments`, `announcements`, `transportRoutes`,
  `vehicles`, `drivers`: readable by any signed-in user (parents/students need to see
  their own child's data, filtered client-side by class/route), writable by staff only
- `notifications`: locked to `targetEmail == request.auth.token.email` for read/update/delete
- `aiLogs`: staff-only create, self-attributed (`userEmail` must match the caller), never editable/deletable; read restricted to admins
- Everything else defaults to staff read+write, signed-in read

Deploy with `firebase deploy --only firestore:rules` after any change.
