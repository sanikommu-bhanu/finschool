import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { getStudentByEmail } from '@/services/students.service';

/** For the Student role — resolves to the signed-in student's own record. */
export function useMyStudentRecord() {
  const email = useAuthStore((s) => s.user?.email ?? '');
  return useQuery({
    queryKey: ['myStudentRecord', email],
    queryFn: () => getStudentByEmail(email),
    enabled: !!email,
    staleTime: 30_000,
  });
}
