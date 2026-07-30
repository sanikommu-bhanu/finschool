import { create, getById, getMany, remove, update, COLLECTIONS } from '@/services/firestore';
import type { ExpenseDoc, ExpenseFormValues } from '@/schemas/expense.schema';

export async function listExpenses(): Promise<ExpenseDoc[]> {
  return getMany<Omit<ExpenseDoc, 'id'>>(COLLECTIONS.expenses, {
    orderBy: [['createdAt', 'desc']],
  }) as Promise<ExpenseDoc[]>;
}

export async function getExpenseById(id: string): Promise<ExpenseDoc | null> {
  return getById<Omit<ExpenseDoc, 'id'>>(COLLECTIONS.expenses, id) as Promise<ExpenseDoc | null>;
}

export async function addExpense(values: ExpenseFormValues, createdBy?: string): Promise<string> {
  return create<ExpenseFormValues & { createdBy: string }>(COLLECTIONS.expenses, {
    ...values,
    note: values.note || '',
    paidTo: values.paidTo || '',
    createdBy: createdBy || '',
  });
}

export async function updateExpense(id: string, values: Partial<ExpenseFormValues>): Promise<void> {
  return update<ExpenseFormValues>(COLLECTIONS.expenses, id, values);
}

export async function deleteExpense(id: string): Promise<void> {
  return remove(COLLECTIONS.expenses, id);
}
