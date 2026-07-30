# Cloud Functions — Smart School FinTech

One function so far: `redeemJoinCodeForParent`, a callable (`onCall`) function that
runs the parent join-code redemption with Admin SDK privileges. It exists specifically
to fix the classmate-merge limitation noted in `PROGRESS.md`: a self-service parent
account can't run a `students` query scoped by `className` under `firestore.rules`
(and shouldn't be able to — that query would otherwise leak every classmate's guardian
contact info to anyone who redeems a code), so the merge lookup has to happen
server-side instead.

The client (`src/services/onboarding.service.ts`) calls this function first and, if it
fails for any reason (not deployed yet, no network, cold-start timeout, etc.), falls
back to the same client-only logic increment 2 shipped — so the app keeps working
either way; deploying this function only upgrades that one behavior (roster-row
merging) rather than being required for the feature to function at all.

## Setup (not run in this sandbox — no network access)

```bash
cd functions
npm install
npm run build        # tsc -> lib/
```

## Deploy

Requires the Firebase project to be on the **Blaze (pay-as-you-go) plan** — 2nd-gen
Cloud Functions (`firebase-functions/v2`) require it even at zero/near-zero usage.

```bash
firebase deploy --only functions
```

## Local testing

```bash
npm run serve   # builds, then starts the functions emulator on port 5001
```

To have the client talk to the emulator instead of production, set
`VITE_USE_FIREBASE_EMULATORS=true` in `.env` (the client already wires up
`connectFunctionsEmulator` when that flag is set — see `src/lib/firebase.ts`).

## Honest gap

This code has not been `npm install`'d, compiled, or deployed/invoked in this
sandbox (no network access, same limitation noted for the main app in `PROGRESS.md`).
It was hand-traced against the Firestore Admin SDK API surface and against
`onboarding.service.ts`'s existing client-side logic (which it mirrors and supersedes
for the merge case), but please run `npm install && npm run build` inside `functions/`
and test against the emulator before relying on it in production.
