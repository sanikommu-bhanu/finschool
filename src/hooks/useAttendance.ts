import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { submitAttendance, listAttendanceForClass, listAttendanceForClasses } from '@/services/attendance.service';
import type { AttendanceRecordValues } from '@/schemas/attendance.schema';

export function useAttendanceForClass(className: string) {
  return useQuery({
    queryKey: ['attendance', 'class', className],
    queryFn: () => listAttendanceForClass(className),
    enabled: !!className,
    staleTime: 15_000,
  });
}

export function useAttendanceForClasses(classNames: string[]) {
  return useQuery({
    queryKey: ['attendance', 'classes', classNames],
    queryFn: () => listAttendanceForClasses(classNames),
    enabled: classNames.length > 0,
    staleTime: 15_000,
  });
}

export function useSubmitAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: AttendanceRecordValues) => submitAttendance(values),
    onSuccess: (_id, values) => {
      toast.success(`Attendance saved for ${values.className}`);
      qc.invalidateQueries({ queryKey: ['attendance'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Could not save attendance'),
  });
}
