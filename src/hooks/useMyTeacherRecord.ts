import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { getTeacherByEmail, parseTeacherClasses } from '@/services/teachers.service';

/** For the Teacher role — resolves to the signed-in teacher's own record + parsed class list. */
export function useMyTeacherRecord() {
  const email = useAuthStore((s) => s.user?.email ?? '');
  const query = useQuery({
    queryKey: ['myTeacherRecord', email],
    queryFn: () => getTeacherByEmail(email),
    enabled: !!email,
    staleTime: 30_000,
  });

  const myClasses = query.data ? parseTeacherClasses(query.data.classes) : [];
  return { ...query, myClasses };
}
