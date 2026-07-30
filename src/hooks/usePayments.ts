import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { collectFee, subscribePayments, subscribeReceipts } from '@/services/payments.service';
import type { CollectFeeValues, PaymentDoc, ReceiptDoc } from '@/schemas/payment.schema';
import type { StudentDoc } from '@/schemas/student.schema';

export function usePayments() {
  const [data, setData] = useState<PaymentDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribePayments(
      (items) => {
        setData(items as PaymentDoc[]);
        setIsLoading(false);
        setIsError(false);
      },
      () => {
        setIsLoading(false);
        setIsError(true);
      }
    );
    return unsubscribe;
  }, []);

  return { data, isLoading, isError };
}

export function useReceipts() {
  const [data, setData] = useState<ReceiptDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeReceipts(
      (items) => {
        setData(items as ReceiptDoc[]);
        setIsLoading(false);
        setIsError(false);
      },
      () => {
        setIsLoading(false);
        setIsError(true);
      }
    );
    return unsubscribe;
  }, []);

  return { data, isLoading, isError };
}

export function useCollectFee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ values, student }: { values: CollectFeeValues; student: Pick<StudentDoc, 'id' | 'name' | 'className' | 'feeDue'> }) =>
      collectFee(values, student),
    onSuccess: () => {
      toast.success('Payment collected');
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['receipts'] });
      qc.invalidateQueries({ queryKey: ['students'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Payment failed — please retry'),
  });
}
