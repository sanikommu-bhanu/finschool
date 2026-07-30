import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { listChildrenByGuardianEmail } from '@/services/students.service';

/** For the Parent role — resolves to the student records linked to the signed-in parent's email. */
export function useMyChildren() {
  const email = useAuthStore((s) => s.user?.email ?? '');
  return useQuery({
    queryKey: ['myChildren', email],
    queryFn: () => listChildrenByGuardianEmail(email),
    enabled: !!email,
    staleTime: 30_000,
  });
}
