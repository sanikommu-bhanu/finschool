/**
 * One-off backfill: populates `classId` on documents that already existed before
 * increment 5 (which only started writing `classId` on *new* writes going forward —
 * see PROGRESS.md). Safe to run more than once (idempotent — re-checks each doc's
 * current classId before writing, skips docs that already have the right one).
 *
 * NOT run in this sandbox — there is no network access here, and this needs real
 * service-account credentials to reach your Firestore project. Run it yourself:
 *
 *   1. Download a service account key from Firebase Console → Project Settings →
 *      Service Accounts → "Generate new private key".
 *   2. From the repo root:
 *        npm install --save-dev firebase-admin ts-node typescript
 *        GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json npx ts-node scripts/backfillClassIds.ts
 *   3. Review the summary it prints (per-collection counts of updated / already-ok /
 *      unresolved). Unresolved just means that className has no matching Class
 *      (section) doc yet — expected until an admin defines classes for it on the
 *      Academic Structure screen; nothing to fix.
 *
 * Uses the Admin SDK, so it bypasses Firestore rules entirely — this is meant to be
 * run by a developer/admin from a trusted machine, not exposed as a callable.
 */

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

/** Mirrors the 5 single-`className` collections that got the classId field in
 * increment 5. Teachers are handled separately below (comma-separated `classes`,
 * not a single `className`, and a `classIds` map instead of a scalar `classId`). */
const CLASSNAME_COLLECTIONS = [
  'classJoinCodes',
  'attendance',
  'assignments',
  'announcements',
  'payments',
  'receipts',
] as const;

interface Summary {
  updated: number;
  alreadyOk: number;
  unresolved: number;
  skippedAll: number; // announcements targeting "All" — expected to have no classId
}

async function loadClassNameToIdMap(): Promise<Map<string, string>> {
  const snap = await db.collection('classes').get();
  const map = new Map<string, string>();
  snap.forEach((doc) => {
    const className = doc.get('className');
    if (typeof className === 'string' && className) map.set(className, doc.id);
  });
  return map;
}

async function backfillCollection(
  collectionName: string,
  nameToId: Map<string, string>
): Promise<Summary> {
  const summary: Summary = { updated: 0, alreadyOk: 0, unresolved: 0, skippedAll: 0 };
  const snap = await db.collection(collectionName).get();

  let batch = db.batch();
  let opsInBatch = 0;
  const commitIfFull = async () => {
    if (opsInBatch >= 400) {
      await batch.commit();
      batch = db.batch();
      opsInBatch = 0;
    }
  };

  for (const doc of snap.docs) {
    const className = doc.get('className');
    const currentClassId = doc.get('classId');

    if (className === 'All') {
      summary.skippedAll += 1;
      continue;
    }
    if (typeof className !== 'string' || !className) {
      summary.unresolved += 1;
      continue;
    }

    const resolvedId = nameToId.get(className);
    if (!resolvedId) {
      summary.unresolved += 1;
      continue;
    }
    if (currentClassId === resolvedId) {
      summary.alreadyOk += 1;
      continue;
    }

    batch.update(doc.ref, { classId: resolvedId });
    opsInBatch += 1;
    summary.updated += 1;
    await commitIfFull();
  }

  if (opsInBatch > 0) await batch.commit();
  return summary;
}

async function backfillTeachers(nameToId: Map<string, string>): Promise<Summary> {
  const summary: Summary = { updated: 0, alreadyOk: 0, unresolved: 0, skippedAll: 0 };
  const snap = await db.collection('teachers').get();

  let batch = db.batch();
  let opsInBatch = 0;
  const commitIfFull = async () => {
    if (opsInBatch >= 400) {
      await batch.commit();
      batch = db.batch();
      opsInBatch = 0;
    }
  };

  for (const doc of snap.docs) {
    const classesCsv = doc.get('classes');
    if (typeof classesCsv !== 'string' || !classesCsv.trim()) {
      summary.unresolved += 1;
      continue;
    }
    const names = classesCsv.split(',').map((c) => c.trim()).filter(Boolean);
    const resolved: Record<string, string> = {};
    let anyMissing = false;
    for (const name of names) {
      const id = nameToId.get(name);
      if (id) resolved[name] = id;
      else anyMissing = true;
    }

    const existing = (doc.get('classIds') as Record<string, string> | undefined) ?? {};
    const same =
      Object.keys(resolved).length === Object.keys(existing).length &&
      Object.entries(resolved).every(([k, v]) => existing[k] === v);

    if (Object.keys(resolved).length === 0) {
      summary.unresolved += 1;
      continue;
    }
    if (same) {
      summary.alreadyOk += 1;
      if (anyMissing) summary.unresolved += 1; // partial resolution, still worth noting
      continue;
    }

    batch.update(doc.ref, { classIds: resolved });
    opsInBatch += 1;
    summary.updated += 1;
    if (anyMissing) summary.unresolved += 1;
    await commitIfFull();
  }

  if (opsInBatch > 0) await batch.commit();
  return summary;
}

async function main() {
  console.log('Loading Class (section) docs to build the className -> classId map...');
  const nameToId = await loadClassNameToIdMap();
  console.log(`Found ${nameToId.size} defined classes.`);

  if (nameToId.size === 0) {
    console.log(
      'No Class (section) docs exist yet (Academic Structure screen). Nothing to backfill — ' +
        'run this again after an admin has defined classes there.'
    );
    return;
  }

  const results: Record<string, Summary> = {};
  for (const col of CLASSNAME_COLLECTIONS) {
    console.log(`Backfilling ${col}...`);
    results[col] = await backfillCollection(col, nameToId);
  }
  console.log('Backfilling teachers (classIds map)...');
  results.teachers = await backfillTeachers(nameToId);

  console.log('\n--- Summary ---');
  for (const [col, s] of Object.entries(results)) {
    console.log(
      `${col}: updated=${s.updated} alreadyOk=${s.alreadyOk} unresolved=${s.unresolved}` +
        (col === 'announcements' ? ` skippedAll=${s.skippedAll}` : '')
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Backfill failed:', err);
    process.exit(1);
  });
