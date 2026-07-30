# Build Progress

## ⏳ Phase 2.5 — increment 5.1 of N: filled the 2 flagged gaps + a backfill script, repo-wide check

Filled the two gaps increment 5 explicitly flagged, plus the "no backfill for
pre-existing docs" gap. **The read-side migration itself is still not started** —
that's a different, larger change (see "still open" below), not a "gap" in what
5/5.1 already shipped.

### Gap 1 — cache invalidation now wired in
`academicStructure.service.ts`'s `createClassSection`/`updateClassSection`/
`deleteClassSection` now call `invalidateClassNameToIdCache()` (update only does so
when `className` itself is part of the patch, since that's the only case that can
make the cache wrong). A class created/renamed/deleted is picked up by
`resolveClassIdByName()`/`resolveClassIdsByNames()` on the very next call, not after
up to 60s.

### Gap 2 — `teacher.schema.ts` classIds bridge, done
- **`schemas/teacher.schema.ts`** — added optional `classIds: Record<className,
  classId>`. Chose a map (not `string[]`) so a partially-resolved teacher (some
  classes defined, some not) still carries a usable association per class, and so
  nothing has to re-parse `classes` to know which id belongs to which name. `classes`
  (the CSV string) remains the source of truth every existing screen reads/writes —
  purely additive, same convention as the other 5 collections' `classId`.
- **`services/academicStructure.service.ts`** — new `resolveClassIdsByNames(names)`,
  the bulk counterpart to `resolveClassIdByName()`, reusing the same cache. Same
  never-throws contract; returns whatever resolved even if part of the lookup fails.
- **`services/teachers.service.ts`** — `createTeacher()`/`updateTeacher()` now
  best-effort populate `classIds` via a small `buildClassIdsMap()` helper, wired
  before the existing `ensureJoinCodesForTeacher()` call (unchanged) in both
  functions. Verified: no circular import (`teachers.service.ts` imports *from*
  `academicStructure.service.ts`, never the reverse).

### Gap 3 — backfill for pre-existing docs, done as a script (not run — can't be, from here)
**`scripts/backfillClassIds.ts`** — a standalone Admin-SDK script (same
`firebase-admin` pattern as `functions/src/index.ts`, but a one-off you run from your
own machine with a service-account key, not a deployed function) that walks all 6
`classId`-bearing collections plus `teachers`, resolves each doc's `className`(s)
against the current Class (section) docs, and batch-updates any that are missing or
stale. Idempotent — safe to re-run. Prints a per-collection summary (updated /
already-ok / unresolved) instead of silently succeeding, so you can see exactly what
it did. **Not executed** — this sandbox has no network access and no service-account
credentials; run instructions are in the file's header comment.

### Repo-wide check performed this pass
- Brace/paren balance verified on every file touched in increment 5 and this pass —
  all matched, no stray syntax breakage.
- Grepped for circular imports across the 6 services that now import
  `academicStructure.service.ts` — none found.
- Regression-checked increment 4.2's `CLASS_OPTIONS` swap is still intact (zero
  direct `CLASS_OPTIONS` usages remain in `src/pages/`).
- Grepped for `.classIds` usage sitewide to confirm the plural (teacher map) and
  singular (`classId`, the other 5 collections) fields aren't confused anywhere.
- **Still not run through a compiler** — same standing limitation, `npm install`
  returns `403` in this sandbox. Everything above is hand-traced and grep-verified,
  not compiled. Please run `npm install && tsc --noEmit && npm run build && npx
  eslint .` before deploying, same as every prior increment note.

### Still open — genuinely out of scope, not a "gap" in this pass
- **The read side of the migration** (teachers/attendance/assignments/
  announcements/reports/AI context switching their *queries* from `className` to
  `classId`) is a separate, larger change from populating the field — it wasn't
  promised as part of "fill the gaps" and doing it blind, without a compiler, across
  8+ read call sites in one pass is exactly the risk this whole increment sequence
  has been avoiding. Flagging clearly rather than quietly attempting it.
- The backfill script needs to actually be run by you (or deployed as a callable) —
  it can't run itself from this sandbox.

---

## ⏳ Phase 2.5 — increment 5 of N: classId migration, step 1 — additive bridge across 5 write paths

**Scope, chosen deliberately narrow:** the full backlog item — teachers, join codes,
attendance, assignments, announcements, payments, reports, and AI context all moving
off the flat `className` string onto a real `classId` reference — is a data-shape
change across 8+ subsystems with zero compiler access in this sandbox. Doing all of
it in one uncompiled pass is exactly the kind of change the brief has repeatedly
asked to be careful with, and it's what every prior increment in this doc has
deliberately deferred for that reason. So, matching the same pattern that worked for
`useClassNameOptions()` (increment 4.1/4.2 — one small bridge, hand-traced, then
proven on real call sites), this increment ships **step 1 only**: a resolver plus
optional `classId` field on the 5 collections whose schema already has a single
`className` string (join codes, attendance, assignments, announcements, payments/
receipts). Reads are **completely untouched** — every existing query still filters on
`className`, unchanged. This is pure forward-populating groundwork.

**Compiler status:** still no network access this pass (`npm install` → same `403`).
Everything below is a hand-trace, not a compiler run — flagging plainly, as instructed.

### `services/academicStructure.service.ts` — new `resolveClassIdByName()`
- A cached (60s TTL) `className -> classId` map built from `listClassSections()`,
  the same data source `useClassNameOptions()` already reads. `resolveClassIdByName()`
  never throws — returns `undefined` for `""`/`"All"`, for a className with no
  matching Class doc yet, or if the lookup itself fails (offline, permission-denied,
  etc.) — so every caller can treat it as a nice-to-have enrichment, not a dependency.
  `invalidateClassNameToIdCache()` exported for completeness (not wired to a caller
  yet — the Academic Structure screen's create/update/delete mutations don't call it
  this pass, so a rename won't be picked up by resolver calls for up to 60s; noted
  below as a real, small gap, not silently swept aside).
- No circular import: this file only imports from `services/firestore.ts` and its own
  schema — the 5 services below import *from* it, not the other way around.

### 5 write paths now best-effort populate `classId`
Same shape in every file: resolve once before the write, spread it in only if
resolved (so older/undefined-lookup docs get no `classId` key at all, not a `null`):

- **`schemas/joinCode.schema.ts`** + **`services/joinCodes.service.ts`**
  `ensureJoinCodesForTeacher()` — resolves per class, same loop that already exists.
- **`schemas/attendance.schema.ts`** + **`services/attendance.service.ts`**
  `submitAttendance()`.
- **`schemas/assignment.schema.ts`** + **`services/assignments.service.ts`**
  `createAssignment()`.
- **`schemas/announcement.schema.ts`** + **`services/announcements.service.ts`**
  `createAnnouncement()` — `resolveClassIdByName()`'s own `"All"` guard means the
  "All classes" announcement target correctly gets no `classId`, without the caller
  needing special-case logic.
- **`schemas/payment.schema.ts`** (`PaymentDoc`/`ReceiptDoc`) +
  **`services/payments.service.ts`** `collectFee()` — resolved once before the
  `writeBatch` is built (the batch has no async gap once `.set` calls start), so the
  payment and its receipt carry the same `classId`.

All five follow the exact `data: T = { ...existing, ...(classId ? { classId } : {}) }`
conditional-spread-onto-an-optional-field pattern `students.service.ts`'s
`createStudent()` already established in increment 1 for `feeTemplateId` — verified
by re-reading that function before writing these, not just remembered.

### Deliberately not touched this pass
- **`teacher.schema.ts`** — teachers store `classes` as a comma-separated free-text
  string (`"10A, 10B"`), not a singular `className`. Bridging that to `classIds: string[]`
  is a different shape of change (parse, resolve N names, dedupe) than the 5 single-
  `className` collections above, and touches `teachers.service.ts`'s
  `ensureJoinCodesForTeacher` call site too — scoping it out to keep this diff
  reviewable, same reasoning as every prior increment's scope cuts.
- **`reports.service.ts`, `aiContext.service.ts`** — both are read-only aggregators
  over the collections above; there's nothing to backfill until they're rewritten to
  *read* `classId`, which is explicitly the next-next step (see below), not this one.
- **No `firestore.rules` changes needed** — checked: `payments`/`attendance`/
  `assignments`/`announcements`/`classJoinCodes` rules are permission-only (no field
  allowlisting), so an additive optional field needs no rule change. Confirmed by
  reading each `match` block before concluding this, not assumed.
- **Backfilling existing docs** — this only affects newly-created docs going forward;
  no migration script was written to backfill `classId` onto documents that already
  exist from before this pass. Flagging as a real gap: if you need historical docs to
  carry `classId` too, that's a one-off script against the Admin SDK, not something to
  guess at from this sandbox.

### Known small gap, not fixed here
`invalidateClassNameToIdCache()` exists but isn't called from the Academic Structure
screen's mutations (`createClassSection`/`updateClassSection`/`deleteClassSection`).
Practically: rename a class, then immediately create a join code/take attendance/etc.
for it within the same 60-second window, and the resolver may still return the old
mapping (or `undefined`) until the cache expires. Since this only affects a newly
*populated* field (nothing existing breaks or becomes wrong), and 60s is short,
this was left as a documented gap rather than wired in without being able to compile
and test the extra import it'd require in `academicStructure.service.ts`'s own
mutation functions.

### Backlog for next increment
Step 2 of this migration (using `classId` on the *read* side — e.g. teachers/
attendance/assignments/announcements/reports switching their `className`-based
queries to `classId`-based ones once enough docs carry it, plus the `teacher.schema.ts`
`classIds` bridge noted above) is **not started**. Doing that safely needs either a
compiler in the loop or a much slower, one-query-at-a-time rollout — flagging rather
than guessing at it here.

---

## ⏳ Phase 2.5 — increment 4.2 of N: finished the `useClassNameOptions()` rollout (3/3 call sites)

**Compiler status, checked again this pass:** still no network access in this sandbox —
`npm install` returns the same `403 Forbidden` from the registry as every prior increment.
Confirmed again before starting. Everything below is a hand-trace, not a compiler run;
please run `npm install && tsc --noEmit && npm run build && npx eslint .` at the project
root (and `cd functions && npm install && npm run build`) before deploying.

**`functions/` reviewed again this pass** (asked to check it if not done before — it was
hand-traced in increment 3 when it was written; re-read `functions/src/index.ts` end-to-end
this pass too). No changes needed: `redeemJoinCodeForParent` still matches its
increment-3 description exactly — validates the caller's auth email against the payload,
resolves the join code, does the elevated classmate-lookup-by-`className` merge via the
Admin SDK, and upserts the parent by email. Untouched by increments 4/4.1/4.2, since none
of this pass's changes touch `students`/`parents`/`classJoinCodes` shape.

### Finished the 2 deferred call sites from increment 4.1
Same reasoning, same zero-risk swap as the `StudentForm.tsx` pilot — both hand-traced
before/after to confirm no behavior change while no `classes` docs exist yet:

- **`pages/admin/students/StudentList.tsx`** (filter chip row) — swapped the `CLASS_OPTIONS`
  import for `useClassNameOptions()`. The chip row is built by filtering the options list
  down to classes actually in use by existing students (`classOptions.filter(c =>
  inUse.has(c))`); since `useClassNameOptions()` returns the exact same array as
  `CLASS_OPTIONS`, in the same order, until an admin populates real classes, this filter
  produces an identical chip row today. Added `classOptions` to the `useMemo` dependency
  array (it wasn't a dependency before because `CLASS_OPTIONS` was a module-level
  constant; now it's hook-returned state, so it has to be listed to satisfy
  `react-hooks/exhaustive-deps` and to actually refresh the chips if classes are added
  later without a page reload). No other reference to `CLASS_OPTIONS` remained in the file.
- **`pages/admin/feeTemplates/FeeTemplateForm.tsx`** (class-picker dropdown) — same swap as
  the `StudentForm.tsx` pilot: import replaced, `const { options: classOptions } =
  useClassNameOptions()` added alongside the existing `useForm` call, dropdown now maps
  over `classOptions` instead of `CLASS_OPTIONS`. `lockClassName` (used when editing an
  existing template) and the RHF `register('className')` wiring are untouched — this is
  a pure data-source swap, same as before.
- Repo-wide grep confirms **zero** remaining `CLASS_OPTIONS` references in `src/pages/`
  — all 3 of the original UI call sites now go through the bridge hook. `CLASS_OPTIONS`
  itself is untouched and still exported from `student.schema.ts`, still consumed
  correctly by `useClassNameOptions()`'s fallback branch and by
  `academicStructure.schema.ts`'s grade-seeding logic.

### Noted, not a regression
`FeeTemplateForm.tsx`'s `lockClassName` mode (editing a template) keeps whatever
`className` was on the template via `defaultValues`/`reset()`, same as before. If an
admin later populates custom classes whose names don't include some class a template
already exists for, that template's dropdown wouldn't list its own value as an option —
this exact edge case already existed against the static `CLASS_OPTIONS` list before this
pass (a template for a class not in `CLASS_OPTIONS` had the same issue), so nothing new
is introduced. Flagging for completeness, not fixing here — out of scope for a pure
data-source swap.

### Backlog for next increment
The bigger migration — teachers, join codes, attendance, assignments, announcements,
payments, reports, AI context moving from the flat `className` string to a real `classId`
reference — has **not** been started, per the instruction not to begin implementing it
without a clear increment plan first. See the plan sketched in this pass's delivery
message (not yet written into this file) for a proposed breakdown into safe,
independently-shippable steps. QR/PDF receipt generation beyond `downloadReceiptPdf`/
`QRSheet.tsx`, and a fully Firestore-grounded AI assistant beyond `aiContext.service.ts`/
`grokService.ts`, both remain open and untouched.

---

## ⏳ Phase 2.5 — increment 3 of N: verified join-code flow, classmate-merge fix, QR wiring

**Not run through `npm install && tsc --noEmit && npm run build && npx eslint .`** — this
sandbox still has no network access (`npm install` returns `403 Forbidden` from the registry;
confirmed again this pass). Everything below was verified by hand-tracing types, imports, and
Firestore rule semantics file-by-file instead — see the honest gap note at the end.

### 1. Join-code redemption flow — traced end-to-end, no permission-denied paths found
Walked both the Student and Parent paths through `JoinCodeEntry.tsx` -> `onboarding.service.ts`
against `firestore.rules`, field by field:
- **Student flow**: `redeemJoinCodeForStudent` writes `studentEmail: email` (the caller's own
  auth email) on create, and `getStudentByEmail` queries `students` filtered on that same
  `studentEmail` field — matches the `create`/read rules exactly. No denied path.
- **Parent flow**: `createParent` writes `email: parentData.email` where `parentData.email`
  comes straight from `authStore` (the caller's own email) — matches the parent `create` rule.
  The one query that *is* denied for a non-staff caller (classmates-by-`className`, used for
  the roster-merge optimization) was already wrapped in try/catch in increment 2, so it
  degrades safely instead of failing the whole redemption — confirmed this catch path is the
  only place that query is reached client-side.
- `useMyStudentRecord`/`useMyChildren` (the "already linked, skip the form" fast path) both
  query scoped to the caller's own email — matches the read rules.

### 2. Classmate-merge limitation — fixed with a Cloud Function, not a rules change
Per the instructions, I didn't guess at a Firestore rules change I couldn't verify without
deploying. The reason the classmates-by-`className` query is denied isn't incidental — loosening
it would let any signed-in parent list every classmate's guardian phone/email/fee-due, a real
privacy regression. So instead:
- **New `functions/` project** — a Firebase Cloud Functions (2nd gen, TypeScript) codebase with
  one callable, `redeemJoinCodeForParent` (`functions/src/index.ts`). It runs the same
  code-validate -> classmate-lookup -> merge-or-create -> parent-upsert sequence, but with the
  Admin SDK, which bypasses Firestore rules entirely — so it *can* run the className query, find
  an admin-pre-registered roster row, and merge into it (setting `guardianEmail`/`teacherId`/
  `joinCodeId`) instead of creating a duplicate student. It re-validates `parent.email` against
  the caller's auth token server-side (never trusts the payload) and upserts the parent doc by
  email so a second child linked later doesn't create a second parent record.
- **`src/services/onboarding.service.ts`** — `redeemJoinCodeForParent` now calls this Cloud
  Function first. If the call fails for *any* reason (not deployed, no network, Blaze plan not
  enabled, cold start, etc.) it falls back to the exact client-only logic increment 2 shipped —
  same "create a fresh student, no merge" behavior as before, logged with `console.warn`. This
  means join-code redemption keeps working end-to-end in a project that hasn't deployed the
  function yet; deploying it only *upgrades* the merge behavior, it isn't a hard dependency.
- **`src/lib/firebase.ts`** — added a `functions` export (`getFunctions`) with emulator wiring
  alongside the existing auth/firestore/storage emulator connections, gated on the same
  `VITE_USE_FIREBASE_EMULATORS` flag.
- **`firebase.json`** — registered `functions` as a deploy target (source `functions/`,
  predeploy build step) and added the functions emulator port.
- **`eslint.config.js`** — added `functions` to the ignore list; it's an isolated codebase with
  its own `package.json`/`tsconfig.json`/dependencies (`firebase-admin`, `firebase-functions`),
  not part of the Vite app's lint/type-check surface, so it can't break `npx eslint .` on the
  main app.
- **`functions/README.md`** — setup, deploy (needs the Blaze plan — 2nd-gen functions require
  it even at ~zero usage), and emulator-testing instructions.

### 3. Teacher Join Codes: QR wiring — done
`src/pages/teacher/JoinCodes.tsx` now renders `QRSheet.tsx` (same component/pattern already
used in `ParentReceipts.tsx`/`TransactionHistory.tsx`). Tapping a class's code (or a dedicated
QR icon button next to copy/share/refresh) opens it as a scannable QR encoding
`{ type: 'join_code', code, className }` — consistent with the `{ type: 'receipt', id }`
convention the receipt QR already uses. The sheet looks up the code live from the same
`useJoinCodes` subscription by id (not a stale snapshot captured at tap time), so if a code is
refreshed while its QR is open, the QR updates immediately instead of showing an invalidated
code. No existing copy/share/refresh behavior changed.

### Honest gaps for the next increment
- **Nothing in this pass — including the new `functions/` code — has been `npm install`'d,
  compiled, or run.** This sandbox has no network access (confirmed again: `npm install` at the
  project root still returns `403`). I hand-traced every new/changed file's imports, types, and
  (for the Cloud Function) the Admin SDK API surface against the client code it supersedes, but
  please run `npm install && tsc --noEmit && npm run build && npx eslint .` at the project root,
  and separately `cd functions && npm install && npm run build`, before deploying either.
- **The Cloud Function is not deployed** (can't be, from this sandbox) and requires the Blaze
  plan. Until it's deployed, parent join-code redemption works exactly as it did in increment 2
  (client-only fallback, no classmate-merge) — this is a soft dependency, not a blocker.
- **Not covered this pass**: School/AcademicYear/Grade/Section as first-class entities, QR/PDF
  receipt generation beyond what `downloadReceiptPdf`/`QRSheet` already do, and a fully
  Firestore-grounded AI assistant remain open — each is its own multi-file increment, as before.

---

## ⏳ Phase 2.5 — increment 2 of N: Fee Templates UI, Join Codes UI, Onboarding, Real-time fan-out

Builds directly on increment 1's backend (feeTemplates/joinCodes/onboarding services). All 4
requested steps have real, working code behind them — see the honest gaps at the end before
you deploy.

### 1. Admin: Fee Templates screen — done
- `src/pages/admin/feeTemplates/FeeTemplateForm.tsx` + `FeeTemplateList.tsx` — same visual
  pattern as `admin/students/StudentForm.tsx`/`StudentList.tsx` (bottom sheets, GlassCard rows,
  Fab to add). Dynamic fee-item rows use `useFieldArray`; a live running total is shown.
  `useFeeTemplates.ts` hook added (react-query, same shape as `useTeachers.ts`).
- Route: `/admin/fee-templates`. Entry point: a new "School Setup" group was added to the
  existing `Settings.tsx` ("More" tab), admin-role-gated — no new bottom-nav item, no changes
  to any existing row in that screen.

### 2. Teacher: Join Codes screen — done
- `src/pages/teacher/JoinCodes.tsx` + `useJoinCodes.ts` (onSnapshot-backed, via
  `subscribeJoinCodesForTeacher`). Copy (clipboard API), Share (Web Share API with a
  clipboard fallback), and Refresh (calls `refreshJoinCode`) actions per class, styled like
  `TeacherFeeReminders.tsx`.
- Reachable via a new "Join Codes" tile added to `TeacherHome.tsx`'s existing quick-actions
  grid (now 5 tiles instead of 4 — same GlassCard/grid pattern, no restructuring). Route:
  `/teacher/join-codes`.

### 3. Parent + Student join-code onboarding screen — done
- `src/pages/onboarding/JoinCodeEntry.tsx`, route `/join-code` (under `RequireAuth`, no
  specific role gate — the component itself checks `role` from `authStore`).
- `RoleSelect.tsx`'s `choose()` now routes Parent/Student to `/join-code` instead of straight
  to their dashboard; every other role's behavior is unchanged.
- The screen first checks (via `useMyStudentRecord`/`useMyChildren`) whether this email is
  *already* linked (e.g. admin pre-registered them) — if so it skips straight to the
  dashboard, matching the existing "no record linked" empty-state fallback already built into
  `StudentHome.tsx`/`ParentHome.tsx`. Otherwise it shows a join-code + details form and calls
  `redeemJoinCodeForStudent`/`redeemJoinCodeForParent`. A "Skip for now" link is always
  available.

### 4. Real-time fan-out — done, for the 3 surfaces the instructions named
- `hooks/useStudents.ts` converted from a one-shot react-query fetch to an `onSnapshot`
  subscription (`services/students.service.ts` `subscribeStudents`), same pattern as
  `useNotifications.ts`. **Kept the exact same `{ data, isLoading, isError }` return shape**,
  so every existing consumer — `AdminHome` (student count), `AccountantHome` (pending-dues
  widget), `StudentList`, `Search`, `Reports`, `CollectFee`, `RouteStudents` — now updates live
  with zero changes to those files.
- `hooks/useMyClassStudents.ts` converted the same way (`subscribeStudentsByClasses`), so
  `TeacherHome`'s student count/list, `TeacherStudents`, `TeacherAttendance`, and
  `TeacherFeeReminders` all update live when a student joins one of the teacher's classes.
- This covers exactly the three dashboards named in the instructions (Admin student count,
  Teacher student list, Accountant pending-fee widget) via one shared underlying fix rather
  than three separate ones, since all three read from the same `students` collection through
  these two hooks.

### Firestore rules + a rules-shaped bug fixed along the way
- `students`/`parents` write rules were `isStaff()`-only, which would have made
  `redeemJoinCodeForStudent`/`redeemJoinCodeForParent` fail with permission-denied the moment
  a real Parent/Student (non-staff) account tried to redeem a code. Added scoped self-serve
  `create`/`update` rules: a signed-in user may only write a student doc where the resulting
  `studentEmail` or `guardianEmail` equals their own auth email, and only a parent doc where
  `email` equals their own — so self-service redemption can never touch someone else's record.
- `redeemJoinCodeForParent`'s "reuse an existing classmate by name" lookup queries `students`
  by `className` only (not scoped to the caller's own email), which the rules above (correctly)
  still deny for a non-staff caller — Firestore's list-query rule evaluation requires the query
  itself to be scoped to the field the rule checks, and this lookup isn't. Wrapped that specific
  query in a try/catch: if it's denied, we just skip the "reuse existing roster row" optimization
  and create a fresh student record instead, so the parent's redemption still succeeds — it just
  never merges into a pre-registered roster row when running as a non-staff caller. This is a
  known, intentional limitation (see below), not a silent failure.

### Honest gaps for the next increment
- **Not run through `npm install && tsc --noEmit && npm run build`** — this sandbox has no
  network access. Please run these before deploying. I traced every new/changed file's imports
  and types by hand but haven't compiled it.
- **Classmate-merge limitation**: a parent redeeming a code for a child the admin *already*
  pre-registered on the roster will, as a self-service (non-staff) account, always create a
  **second** student record rather than merging into the admin's pre-registered one (see above).
  Admin/staff-driven calls to the same function (if ever wired to an admin screen) don't have
  this limitation. Properly fixing this for parents would need either (a) a narrower Firestore
  query parents are allowed to run (e.g. an index on `className`+some public marker field), or
  (b) a Cloud Function that runs the lookup with elevated privileges. Flagging rather than
  guessing at a rules change I can't verify without deploying.
- **Student join-code screen requires guardian name/phone up front** (they're required fields
  on `studentSchema`), even though a student self-registering may not have those handy. Kept as
  real required inputs rather than inventing placeholder data — a nicer flow would let a student
  join without guardian info and have a parent fill it in later, but that's a schema change
  outside this pass's scope.
- **No QR code shown for join codes yet** — `QRSheet.tsx` already exists and is a natural fit
  (tap a code to show it as a scannable QR), but wasn't wired in this pass to keep scope tight.
- School/AcademicYear/Grade/Section as first-class entities, QR/PDF receipt generation beyond
  what already exists, and a fully Firestore-grounded AI assistant remain open, as noted in the
  increment-1 notes below.

---

## ✅ Phase 2.5 — increment 4: School / Academic Year / Grade / Class as first-class entities

**Scope:** additive only, per the brief — no existing UI/nav/behavior for the 21 files
already keyed on the flat `className` string was touched in this increment. This ships
the reference-data layer (School profile, Academic Years, Grades, Classes/Sections) as
real Firestore-backed screens under a new Admin route, wired from Settings.

- **`schemas/academicStructure.schema.ts`** — four schemas: `schoolProfileSchema`
  (singleton doc), `academicYearSchema`, `gradeSchema`, `classSectionSchema`. The
  `classes` collection (previously reserved but unused) is now the Class/Section
  entity. `classSectionSchema.className` is a denormalized string built by
  `buildClassName(gradeName, section)` — the exact value every other feature already
  reads/writes as `className`, so anything created here is a legitimate value in the
  existing app the moment it's created.
- **`services/academicStructure.service.ts`** — thin CRUD wrapper following the same
  `getMany`/`create`/`update`/`remove`/`subscribe` pattern every other service uses
  (verified against `firestore.ts`'s actual exported signatures — all match).
  `createAcademicYear`/`updateAcademicYear` enforce "only one active year at a time" by
  demoting others. `createClassSection` guards against two sections resolving to the
  same `className` (every other feature treats `className` as a unique key).
- **`hooks/useAcademicStructure.ts`** — React Query hooks, one query + create/update/
  delete mutation set per entity, matching `useFeeTemplates.ts`'s exact shape
  (toast on success/error, `invalidateQueries` on the entity's query key).
- **`pages/admin/academicStructure/{AcademicStructure,SchoolProfileTab,AcademicYearsTab,ClassesTab}.tsx`**
  — a 3-tab admin screen (School / Years / Grades & Classes). Verified every
  component/prop used (`GlassCard`, `Button`, `Skeleton`, `EmptyState`, `Fab`,
  `BottomSheet`) against their actual prop signatures — no mismatches. Form
  conventions (RHF + `zodResolver`, `register('field')` on `type="number"` inputs
  relying on `z.coerce.number()` rather than `valueAsNumber`) match
  `FeeTemplateForm.tsx` exactly.
- **Routing**: `/admin/academic-structure`, nested correctly under the existing
  `RequireRole allow="admin"` guard in `App.tsx`. Linked from Settings → "School
  Setup" (admin-only section, `role === 'admin'` gated) alongside the existing Fee
  Templates entry, same button styling/pattern.
- **`firestore.rules`**: `schoolProfile`, `academicYears`, `grades` — signed-in read,
  admin-only write (stricter than `classes`'s existing staff-write rule, intentionally
  — these define the school itself, not day-to-day operational data). No composite
  Firestore indexes were needed for any of the new queries (each uses at most one
  `where` or one `orderBy`, never both together), so `firestore.indexes.json` was
  correctly left unchanged.
- Removed a stray empty `{components` directory left over from an earlier increment's
  mistaken shell command.

### Hand-trace review performed this pass
Read every new/changed file end-to-end against its sibling conventions (schema shape,
service signatures, hook shape, component prop types, RHF/Zod numeric-input pattern,
Firestore rule shape) rather than skimming. No mismatches found — no bug fixes were
needed. Confirmed via grep that none of the 21 className-consuming files were touched.

### Honest gaps
- **Not run through `npm install && tsc --noEmit && npm run build && npx eslint .`** —
  this sandbox has no network access (`npm registry` returns 403), same limitation as
  every prior increment. The review above is a manual hand-trace, not a compiler run.
  Please run those four commands before deploying.
- Grade/Class wiring into the 21 existing screens is still open — see the increment
  4.1 pilot immediately below for the first concrete step on this.

---

## ✅ Phase 2.5 — increment 4.1: pilot wiring of Grade/Class into existing screens

**The risky part, done carefully and narrowly.** Rewriting all 21 className-consuming
files to read `classId` instead of the flat string is out of scope for one pass (no
compiler available to catch a mistake across that many files, and it's explicitly the
kind of change the brief says to be careful with). Instead, this increment adds one
safe bridge and proves it on a single, representative screen.

- **`hooks/useAcademicStructure.ts` → `useClassNameOptions()`** (new) — reads the
  `classes` collection; if an admin has defined any Class/Section docs, returns their
  `className` values (de-duplicated); if none exist yet, falls back to the exact
  original `CLASS_OPTIONS` array, in the same order. This is a **same-behavior swap**
  for any screen that only ever used `CLASS_OPTIONS` to render a dropdown of valid
  class-name strings — until an admin actually populates classes on the new Academic
  Structure screen, every consumer of this hook behaves identically to before.
- **`pages/admin/students/StudentForm.tsx`** — swapped its `CLASS_OPTIONS` import for
  `useClassNameOptions()`. This is the pilot: verified the returned shape
  (`{ options, isLoading, usingCustomClasses }`) is consumed correctly, and that no
  other reference to `CLASS_OPTIONS` remains in the file.

### Deliberately deferred, not done this pass
- **`pages/admin/students/StudentList.tsx`** (uses `CLASS_OPTIONS` to build a filter
  chip row) and **`pages/admin/feeTemplates/FeeTemplateForm.tsx`** (class-picker
  dropdown, same pattern as `StudentForm.tsx`) are the other two of the three total
  UI call sites of `CLASS_OPTIONS` in the app. Both are equally safe to switch to
  `useClassNameOptions()` — same reasoning as above — but weren't switched in this
  pass to keep this increment's diff reviewable in one sitting. This is next.
- **Every other consumer of the flat `className` string** (teachers, join codes,
  attendance, assignments, announcements, payments, reports, AI context — the 21
  files noted throughout this doc) reads/writes `className` as free text, not from a
  dropdown sourced from `CLASS_OPTIONS`, so `useClassNameOptions()` doesn't apply to
  them directly. Migrating those to reference a real `classId` (rather than just
  offering a nicer dropdown) is a materially bigger, separate change — it touches
  data shape, not just UI — and remains explicitly out of scope until planned on its
  own.
- Not run through the compiler, same network limitation as above.

---

## ⏳ Phase 2.5 (business-workflow refactor) — increment 1 of N: Fee Templates + Join Codes

**Scope note:** the full Phase 2.5 spec (School/AcademicYear/Grade/Section entities, full
join-code-driven onboarding UI, 10+ cross-dashboard real-time event fan-outs, QR/PDF receipt
generation, a fully dynamic AI assistant) is too large for one pass on top of this codebase's
current flat data model. This increment ships the two most self-contained, concretely-specified
systems from the spec as real, working Firestore backend code — **no UI/nav/styling touched
at all**, per the "do not change the existing UI" instruction. Everything below is additive.

- **`schemas/feeTemplate.schema.ts`** + **`services/feeTemplates.service.ts`** — one reusable
  fee template per class (`className -> [{name, amount}]`). `createFeeTemplate` refuses to
  create a second template for a class that already has one. `updateFeeTemplate` only ever
  writes the template doc — it never touches `payments`/`receipts`/a student's already-assigned
  `feeDue`, so edits only affect future/unpaid assignments, never completed payment history.
- **`schemas/joinCode.schema.ts`** + **`services/joinCodes.service.ts`** — one 6-character code
  per (teacherId, className) pair, keyed by a deterministic doc id so a teacher can't end up
  with duplicate codes for a class they already have one for. `ensureJoinCodesForTeacher` is
  called automatically from `createTeacher`/`updateTeacher` in `teachers.service.ts` — a code is
  generated for every class the moment a teacher is created or their `classes` field changes.
  `refreshJoinCode` regenerates a code on demand; `validateJoinCode` resolves a code a
  parent/student typed in back to its class + teacher.
- **`services/students.service.ts` `createStudent`** — now auto-assigns the class's fee
  template total to `feeDue` when the caller didn't already set an explicit fee amount ("no
  manual fee creation").
- **`services/onboarding.service.ts`** (new) — `redeemJoinCodeForStudent` /
  `redeemJoinCodeForParent`: the data-layer half of the Student/Parent join-code workflow
  (validate code -> link/create student -> assign teacher + fee template -> for parents, also
  create the parent doc with `guardianEmail` wired to the child). **Not yet wired to a screen**
  — there's no existing "enter join code" UI in the app to hook into without adding new UI,
  which this pass intentionally avoids. Next increment should add that entry screen.
- **`schemas/student.schema.ts`** — added `feeTemplateId`, `teacherId`, `joinCodeId` as
  *optional* fields only, so every existing form/screen that builds a `StudentFormValues`
  keeps compiling and behaving exactly as before.
- **`firestore.rules`** — added explicit rules for the two new collections
  (`feeTemplates`, `classJoinCodes`) instead of falling through to the generic catch-all.

### Honest gaps for the next increment
- No admin UI yet to *view/edit* fee templates or *see/refresh* join codes — only the backend
  exists. Wiring these into, e.g., a new tab under the existing Admin "More" area (or Settings)
  is the natural next step without disturbing current nav.
- No join-code entry screen for Parent/Student signup yet — `onboarding.service.ts` is ready to
  be called from one.
- School/AcademicYear/Grade/Section as first-class entities, full real-time fan-out across all
  6 dashboards for every event type, QR code + PDF receipt generation, and a fully Firestore-
  grounded AI assistant (beyond what `aiContext.service.ts`/`grokService.ts` already do) are
  all still open — each is its own multi-file increment.
- Not run through `npm install && tsc --noEmit && npm run build` in this session — this sandbox
  has no network access. Please run those three before deploying, same as noted below for the
  prior pass.

## ✅ Done — all 13 original steps
(unchanged from before — see git history / README for the full step-by-step list.)

## ✅ Step 14 — Real threaded messaging + full-text search (this pass)

- **New data model**: `schemas/message.schema.ts` — `ThreadDoc` (`participantEmails`,
  `participants`, `lastMessage`, `lastSenderEmail`, `unreadBy`, timestamps) and `MessageDoc`
  (`senderId`, `senderName`, `text`, `readBy`, `createdAt`) living at
  `threads/{threadId}/messages/{messageId}`.
- **`services/threads.service.ts`** — same shape as `notifications.service.ts`: onSnapshot
  subscriptions (`subscribeThreadsForEmail`, `subscribeThreadMessages`), plus
  `getOrCreateThreadWith`, `sendThreadMessage` (batched message + thread-preview write),
  `markThreadRead` (batched `arrayRemove`/`arrayUnion`).
- **`hooks/useThreads.ts`** — `useThreads`, `useThreadMessages`, `useStartThread`,
  `useSendMessage`, `useMarkThreadRead`, mirroring `useNotifications.ts`.
- **`Messages.tsx`** rewritten onto real Firestore data — same visual design, now with
  loading skeletons, an empty state, and live send/read behavior. Reachable from
  Profile → "Messages" (previously an orphaned route with no link anywhere in the app —
  fixed).
- **`Search.tsx`** extended: was already Firestore-backed for students/teachers (not mock,
  despite the old note below); added parents and payments/transactions, plus a "Message"
  button on each person that opens/creates a thread via Search → Messages handoff.
- **`services/mockData.ts` deleted.** Every export in it (`googleAccounts`, `revenueTrend`,
  `collectionOverview`, `feeBreakdown`, `expenseBreakdown`, `recentTransactions`,
  `notifications`, `messages`, `students`, `calendarEvents`, `timetable`, `examResults`,
  `busRoutes`) was either already unused (dead code from an earlier pass) or — in the case
  of `messages` — only used by the old `Messages.tsx`, which no longer needs it.
- `firestore.rules` — added explicit `threads`/`messages` rules scoped to participants only.
- `firestore.indexes.json` — added the composite index `threads` needs for
  `array-contains(participantEmails) + orderBy(updatedAt)`.
- `eslint.config.js` **added** — there was no ESLint config in the repo at all (ESLint 9
  needs a flat config), so `npx eslint .` had nothing to run against. Built from the
  plugins already in `package.json` devDependencies.

## Corrected gap note (previously said Search.tsx used mockData — it didn't)

The prior note below claimed both `Messages.tsx` and `Search.tsx` read from `mockData.ts`.
Re-grepping the codebase before touching anything (as instructed) showed `Search.tsx` was
**already** wired to `useStudents`/`useTeachers` (real Firestore) — only `Messages.tsx`
actually imported `mockData`. Search has now been extended (parents + transactions) rather
than rewritten from scratch.

## ~~Known, intentionally-flagged gap~~ — closed this pass

~~`Messages` and global `Search` still render from `src/services/mockData.ts`~~ — done above.

## Before you deploy

1. `npm install && npm run build && npx tsc --noEmit && npx eslint .` locally — **this
   sandbox has no network access** (npm registry returns 403), so none of these were run
   end-to-end in this session. See the delivery message for a full manual code review in
   lieu of execution, and run these four commands yourself before shipping.
2. Enable Google sign-in + create the Firestore DB in the Firebase Console (test mode is
   fine initially).
3. `firebase deploy --only firestore:rules,firestore:indexes,storage` — required for the
   new `threads` composite index and security rules to take effect.
4. Optional: add `VITE_GROK_API_KEY` for the AI Assistant.
