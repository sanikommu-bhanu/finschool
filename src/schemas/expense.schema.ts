import { z } from 'zod';

export const expenseCategorySchema = z.enum(['salary', 'transport', 'utilities', 'maintenance', 'others']);
export type ExpenseCategory = z.infer<typeof expenseCategorySchema>;

export const EXPENSE_CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  salary: 'Salary',
  transport: 'Transport',
  utilities: 'Utilities',
  maintenance: 'Maintenance',
  others: 'Others',
};

export const EXPENSE_CATEGORY_COLOR: Record<ExpenseCategory, string> = {
  salary: '#EE7A90',
  transport: '#F6A0AF',
  utilities: '#F6C7AA',
  maintenance: '#D3C6EC',
  others: '#E8A6B4',
};

export const expenseFormSchema = z.object({
  title: z.string().trim().min(2, 'Enter a short title'),
  category: expenseCategorySchema,
  amount: z.coerce.number().positive('Enter an amount greater than 0'),
  paidTo: z.string().trim().optional(),
  note: z.string().trim().optional(),
});

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

export interface ExpenseDoc {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  paidTo?: string;
  note?: string;
  createdBy?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}
