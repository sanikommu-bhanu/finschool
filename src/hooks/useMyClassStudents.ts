import { useEffect, useState } from 'react';
import { subscribeStudentsByClasses } from '@/services/students.service';
import type { StudentDoc } from '@/schemas/student.schema';

/**
 * Live (onSnapshot-backed) student list scoped to a teacher's classes. Converted from
 * a one-shot react-query fetch so TeacherHome/TeacherStudents/TeacherAttendance/
 * TeacherFeeReminders all update immediately when a student joins one of these classes
 * (e.g. via a join-code redemption) — no manual refresh needed. Same {data, isLoading}
 * shape as before so no consumer needed to change.
 */
export function useMyClassStudents(classNames: string[]) {
  const [data, setData] = useState<StudentDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const key = classNames.join('|');

  useEffect(() => {
    if (classNames.length === 0) {
      setData([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const unsubscribe = subscribeStudentsByClasses(
      classNames,
      (items) => {
        setData(items);
        setIsLoading(false);
      },
      () => setIsLoading(false)
    );
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { data, isLoading };
}
