import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { addExpense, deleteExpense, getExpenseById, listExpenses, updateExpense } from '@/services/expenses.service';
import type { ExpenseFormValues } from '@/schemas/expense.schema';

export function useExpenses() {
  return useQuery({ queryKey: ['expenses'], queryFn: listExpenses, staleTime: 15_000 });
}

export function useExpense(id?: string) {
  return useQuery({
    queryKey: ['expenses', id],
    queryFn: () => getExpenseById(id as string),
    enabled: !!id,
  });
}

export function useAddExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ values, createdBy }: { values: ExpenseFormValues; createdBy?: string }) => addExpense(values, createdBy),
    onSuccess: () => {
      toast.success('Expense added');
      qc.invalidateQueries({ queryKey: ['expenses'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Could not add expense'),
  });
}

export function useUpdateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<ExpenseFormValues> }) => updateExpense(id, values),
    onSuccess: (_data, variables) => {
      toast.success('Expense updated');
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['expenses', variables.id] });
    },
    onError: (err: Error) => toast.error(err.message || 'Could not update expense'),
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    onSuccess: () => {
      toast.success('Expense deleted');
      qc.invalidateQueries({ queryKey: ['expenses'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Could not delete expense'),
  });
}
