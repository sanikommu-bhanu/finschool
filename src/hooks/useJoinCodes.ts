import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { subscribeJoinCodesForTeacher, refreshJoinCode } from '@/services/joinCodes.service';
import type { ClassJoinCodeDoc } from '@/schemas/joinCode.schema';

/**
 * Live (onSnapshot-backed) list of a teacher's class join codes. Using a subscription
 * rather than a one-shot query means a newly-added class's code (created by
 * ensureJoinCodesForTeacher when Admin edits the teacher's `classes` field) shows up
 * here immediately, without the teacher needing to refresh.
 */
export function useJoinCodes(teacherId: string | undefined) {
  const [codes, setCodes] = useState<ClassJoinCodeDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!teacherId) {
      setCodes([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const unsubscribe = subscribeJoinCodesForTeacher(
      teacherId,
      (items) => {
        setCodes(items);
        setIsLoading(false);
        setIsError(false);
      },
      () => {
        setIsLoading(false);
        setIsError(true);
      }
    );
    return unsubscribe;
  }, [teacherId]);

  return { data: codes, isLoading, isError };
}

export function useRefreshJoinCode() {
  return useMutation({
    mutationFn: (id: string) => refreshJoinCode(id),
    onSuccess: () => toast.success('New code generated'),
    onError: () => toast.error('Could not refresh code'),
  });
}
