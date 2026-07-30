import { z } from 'zod';

/**
 * A single line item on a fee template, e.g. { name: 'Tuition Fee', amount: 12000 }.
 * `id` is a short client-generated key so line items can be edited/reordered in a form
 * without relying on array index.
 */
export const feeTemplateItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, 'Fee item name is required'),
  amount: z.coerce.number().min(0, 'Amount cannot be negative'),
});

export type FeeTemplateItem = z.infer<typeof feeTemplateItemSchema>;

/**
 * Firestore doc shape for the `feeTemplates` collection.
 * One template per className. Admin edits it; existing *paid* fee records are never
 * touched by an edit (see feeTemplates.service.ts `updateFeeTemplate`) — only unpaid/
 * future assignments pick up the new amounts.
 */
export const feeTemplateSchema = z.object({
  className: z.string().trim().min(1, 'Select a class'),
  items: z.array(feeTemplateItemSchema).min(1, 'Add at least one fee item'),
  academicYear: z.string().trim().optional(),
});

export type FeeTemplateFormValues = z.infer<typeof feeTemplateSchema>;

export interface FeeTemplateDoc extends FeeTemplateFormValues {
  id: string;
  totalAmount: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export const defaultFeeTemplateValues: FeeTemplateFormValues = {
  className: '',
  items: [
    { id: 'admission', name: 'Admission Fee', amount: 0 },
    { id: 'tuition', name: 'Tuition Fee', amount: 0 },
    { id: 'exam', name: 'Exam Fee', amount: 0 },
    { id: 'transport', name: 'Transport Fee', amount: 0 },
  ],
  academicYear: '',
};

export function computeTemplateTotal(items: FeeTemplateItem[]): number {
  return items.reduce((sum, item) => sum + (Number.isFinite(item.amount) ? item.amount : 0), 0);
}
