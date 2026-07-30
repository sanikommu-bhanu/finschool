import { z } from 'zod';

export const paymentMethodSchema = z.enum(['upi', 'card', 'cash']);
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

export const collectFeeSchema = z.object({
  studentId: z.string().min(1, 'Select a student'),
  amount: z.coerce.number().positive('Enter an amount greater than 0'),
  method: paymentMethodSchema,
  note: z.string().trim().optional(),
});

export type CollectFeeValues = z.infer<typeof collectFeeSchema>;

export interface PaymentDoc {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  // Optional — populated best-effort by collectFee() via resolveClassIdByName().
  // Additive only; every existing query/read on payments still uses className.
  classId?: string;
  amount: number;
  method: PaymentMethod;
  status: 'success' | 'failed';
  transactionId: string;
  note?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ReceiptDoc {
  id: string;
  paymentId: string;
  receiptNo: string;
  studentId: string;
  studentName: string;
  className: string;
  // Optional — same best-effort classId as PaymentDoc, mirrored onto the receipt.
  classId?: string;
  amount: number;
  method: PaymentMethod;
  transactionId: string;
  issuedAt?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
}
