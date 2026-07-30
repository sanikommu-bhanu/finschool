import {
  getMany,
  getById,
  create,
  update,
  remove,
  subscribe,
  COLLECTIONS,
} from '@/services/firestore';
import {
  computeTemplateTotal,
  type FeeTemplateDoc,
  type FeeTemplateFormValues,
} from '@/schemas/feeTemplate.schema';

/**
 * All reads/writes for the `feeTemplates` collection.
 *
 * Business rule (from the Phase 2.5 spec): one reusable template per class.
 * Creating a student in that class auto-assigns the template's current total as
 * `feeDue` (see `students.service.ts` `createStudent`). Editing a template later
 * NEVER rewrites completed payment history — it only changes what future/unpaid
 * fee assignments will use, since we only ever read the template at
 * assignment-time and never re-touch existing payment/receipt docs here.
 */

export async function listFeeTemplates(): Promise<FeeTemplateDoc[]> {
  return getMany<FeeTemplateFormValues>(COLLECTIONS.feeTemplates, {
    orderBy: [['className', 'asc']],
  }) as Promise<FeeTemplateDoc[]>;
}

export function subscribeFeeTemplates(cb: (templates: FeeTemplateDoc[]) => void, onError?: (err: Error) => void) {
  return subscribe<FeeTemplateFormValues>(
    COLLECTIONS.feeTemplates,
    { orderBy: [['className', 'asc']] },
    cb as (items: (FeeTemplateFormValues & { id: string })[]) => void,
    onError
  );
}

export async function getFeeTemplate(id: string): Promise<FeeTemplateDoc | null> {
  return getById<FeeTemplateFormValues>(COLLECTIONS.feeTemplates, id) as Promise<FeeTemplateDoc | null>;
}

/** Look up the single template for a class, e.g. "Class 8" -> its template, or null if admin hasn't created one yet. */
export async function getFeeTemplateForClass(className: string): Promise<FeeTemplateDoc | null> {
  if (!className) return null;
  const results = (await getMany<FeeTemplateFormValues>(COLLECTIONS.feeTemplates, {
    where: [['className', '==', className]],
    limit: 1,
  })) as FeeTemplateDoc[];
  return results[0] ?? null;
}

/** Create a template. Fails loudly (via existing template check) rather than silently duplicating one for a class. */
export async function createFeeTemplate(data: FeeTemplateFormValues): Promise<string> {
  const existing = await getFeeTemplateForClass(data.className);
  if (existing) {
    throw new Error(`A fee template already exists for ${data.className}. Edit it instead of creating another.`);
  }
  return create<FeeTemplateFormValues & { totalAmount: number }>(COLLECTIONS.feeTemplates, {
    ...data,
    totalAmount: computeTemplateTotal(data.items),
  });
}

/**
 * Update a template's line items/amounts.
 * Only ever mutates the template doc itself — never touches `payments`, `receipts`,
 * or any student's already-assigned `feeDue`/`feeItems`, so completed payment
 * history and already-invoiced amounts are preserved exactly as-is.
 */
export async function updateFeeTemplate(id: string, data: Partial<FeeTemplateFormValues>): Promise<void> {
  const current = await getFeeTemplate(id);
  const items = data.items ?? current?.items ?? [];
  return update<FeeTemplateFormValues & { totalAmount: number }>(COLLECTIONS.feeTemplates, id, {
    ...data,
    totalAmount: computeTemplateTotal(items),
  });
}

export async function deleteFeeTemplate(id: string): Promise<void> {
  return remove(COLLECTIONS.feeTemplates, id);
}
