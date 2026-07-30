import { useState, useEffect } from 'react';
import { subscribePaymentsForStudents, subscribeReceiptsForStudents } from '@/services/payments.service';
import type { PaymentDoc, ReceiptDoc } from '@/schemas/payment.schema';

/** Payments/receipts scoped to a known set of student IDs (a parent's children, or a single student themself). */
export function usePaymentsForStudents(studentIds: string[]) {
  const [data, setData] = useState<PaymentDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (studentIds.length === 0) {
      setData([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const unsubscribe = subscribePaymentsForStudents(
      studentIds,
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
  }, [studentIds.join(',')]);

  return { data, isLoading, isError };
}

export function useReceiptsForStudents(studentIds: string[]) {
  const [data, setData] = useState<ReceiptDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (studentIds.length === 0) {
      setData([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const unsubscribe = subscribeReceiptsForStudents(
      studentIds,
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
  }, [studentIds.join(',')]);

  return { data, isLoading, isError };
}
