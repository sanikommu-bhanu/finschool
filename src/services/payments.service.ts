import {
  collection,
  doc,
  writeBatch,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getMany, getById, subscribe, COLLECTIONS } from '@/services/firestore';
import type { CollectFeeValues, PaymentDoc, ReceiptDoc } from '@/schemas/payment.schema';
import type { StudentDoc, StudentFormValues } from '@/schemas/student.schema';
import { resolveClassIdByName } from '@/services/academicStructure.service';

function generateTransactionId(method: string): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `TXN-${method.toUpperCase()}-${Date.now().toString().slice(-6)}${rand}`;
}

function generateReceiptNo(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `RCPT-${year}-${rand}`;
}

/**
 * Simulated fee collection — no real payment gateway (per spec, free-tier only).
 * Writes payment + receipt + updated student fee balance in one atomic batch so a
 * failure partway through (e.g. offline) can never leave the student's fee balance
 * out of sync with the payment record.
 */
export async function collectFee(
  values: CollectFeeValues,
  student: Pick<StudentDoc, 'id' | 'name' | 'className' | 'feeDue'>
): Promise<{ payment: PaymentDoc; receipt: ReceiptDoc }> {
  const batch = writeBatch(db);

  const paymentRef = doc(collection(db, COLLECTIONS.payments));
  const receiptRef = doc(collection(db, COLLECTIONS.receipts));
  const studentRef = doc(db, COLLECTIONS.students, student.id);

  const transactionId = generateTransactionId(values.method);
  const receiptNo = generateReceiptNo();
  // Best-effort only — resolved before the batch is built (writeBatch itself has no
  // async gap once .set/.update calls start) so both payment and receipt carry the
  // same classId; never blocks fee collection if the lookup fails.
  const classId = await resolveClassIdByName(student.className);

  const paymentData = {
    studentId: student.id,
    studentName: student.name,
    className: student.className,
    ...(classId ? { classId } : {}),
    amount: values.amount,
    method: values.method,
    status: 'success' as const,
    transactionId,
    note: values.note || '',
  };

  const receiptData = {
    paymentId: paymentRef.id,
    receiptNo,
    studentId: student.id,
    studentName: student.name,
    className: student.className,
    ...(classId ? { classId } : {}),
    amount: values.amount,
    method: values.method,
    transactionId,
    issuedAt: serverTimestamp(),
  };

  batch.set(paymentRef, { ...paymentData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  batch.set(receiptRef, { ...receiptData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });

  const remaining = Math.max(0, student.feeDue - values.amount);
  batch.update(studentRef, {
    feeDue: increment(-values.amount),
    feeStatus: remaining <= 0 ? 'paid' : 'due',
    updatedAt: serverTimestamp(),
  });

  await batch.commit();

  return {
    payment: { id: paymentRef.id, ...paymentData },
    receipt: { id: receiptRef.id, ...receiptData },
  };
}

export async function listPayments(): Promise<PaymentDoc[]> {
  return getMany<Omit<PaymentDoc, 'id'>>(COLLECTIONS.payments, {
    orderBy: [['createdAt', 'desc']],
  }) as Promise<PaymentDoc[]>;
}

export function subscribePayments(cb: (payments: PaymentDoc[]) => void, onError?: (err: Error) => void) {
  return subscribe<Omit<PaymentDoc, 'id'>>(
    COLLECTIONS.payments,
    { orderBy: [['createdAt', 'desc']] },
    cb as (items: (Omit<PaymentDoc, 'id'> & { id: string })[]) => void,
    onError
  );
}

export async function listReceipts(): Promise<ReceiptDoc[]> {
  return getMany<Omit<ReceiptDoc, 'id'>>(COLLECTIONS.receipts, {
    orderBy: [['createdAt', 'desc']],
  }) as Promise<ReceiptDoc[]>;
}

export function subscribeReceipts(cb: (receipts: ReceiptDoc[]) => void, onError?: (err: Error) => void) {
  return subscribe<Omit<ReceiptDoc, 'id'>>(
    COLLECTIONS.receipts,
    { orderBy: [['createdAt', 'desc']] },
    cb as (items: (Omit<ReceiptDoc, 'id'> & { id: string })[]) => void,
    onError
  );
}

/** Payments for one or more specific students — used by Parent (their children) and Student (themselves) dashboards. */
export async function listPaymentsForStudents(studentIds: string[]): Promise<PaymentDoc[]> {
  if (studentIds.length === 0) return [];
  return getMany<Omit<PaymentDoc, 'id'>>(COLLECTIONS.payments, {
    where: [['studentId', 'in', studentIds.slice(0, 10)]],
    orderBy: [['createdAt', 'desc']],
  }) as Promise<PaymentDoc[]>;
}

export function subscribePaymentsForStudents(studentIds: string[], cb: (payments: PaymentDoc[]) => void, onError?: (err: Error) => void) {
  if (studentIds.length === 0) {
    cb([]);
    return () => {};
  }
  return subscribe<Omit<PaymentDoc, 'id'>>(
    COLLECTIONS.payments,
    {
      where: [['studentId', 'in', studentIds.slice(0, 10)]],
      orderBy: [['createdAt', 'desc']],
    },
    cb as (items: (Omit<PaymentDoc, 'id'> & { id: string })[]) => void,
    onError
  );
}

export async function listReceiptsForStudents(studentIds: string[]): Promise<ReceiptDoc[]> {
  if (studentIds.length === 0) return [];
  return getMany<Omit<ReceiptDoc, 'id'>>(COLLECTIONS.receipts, {
    where: [['studentId', 'in', studentIds.slice(0, 10)]],
    orderBy: [['createdAt', 'desc']],
  }) as Promise<ReceiptDoc[]>;
}

export function subscribeReceiptsForStudents(studentIds: string[], cb: (receipts: ReceiptDoc[]) => void, onError?: (err: Error) => void) {
  if (studentIds.length === 0) {
    cb([]);
    return () => {};
  }
  return subscribe<Omit<ReceiptDoc, 'id'>>(
    COLLECTIONS.receipts,
    {
      where: [['studentId', 'in', studentIds.slice(0, 10)]],
      orderBy: [['createdAt', 'desc']],
    },
    cb as (items: (Omit<ReceiptDoc, 'id'> & { id: string })[]) => void,
    onError
  );
}

/** Single receipt lookup by ID — used by the QR scanner (Accountant/Admin scan a printed/shown receipt QR). */
export async function getReceiptById(id: string): Promise<ReceiptDoc | null> {
  return getById<Omit<ReceiptDoc, 'id'>>(COLLECTIONS.receipts, id) as Promise<ReceiptDoc | null>;
}

/** Single payment lookup by ID. */
export async function getPaymentById(id: string): Promise<PaymentDoc | null> {
  return getById<Omit<PaymentDoc, 'id'>>(COLLECTIONS.payments, id) as Promise<PaymentDoc | null>;
}

export async function listStudentsForCollection(): Promise<StudentDoc[]> {
  return getMany<StudentFormValues>(COLLECTIONS.students, {
    orderBy: [['name', 'asc']],
  }) as Promise<StudentDoc[]>;
}
