import { getMany, create, COLLECTIONS } from '@/services/firestore';
import type { AttendanceDoc, AttendanceRecordValues, AttendanceStatus } from '@/schemas/attendance.schema';
import { resolveClassIdByName } from '@/services/academicStructure.service';

function tally(records: Record<string, AttendanceStatus>) {
  const values = Object.values(records);
  return {
    presentCount: values.filter((v) => v === 'present').length,
    absentCount: values.filter((v) => v === 'absent').length,
    leaveCount: values.filter((v) => v === 'leave').length,
    totalCount: values.length,
  };
}

/** Records one class's attendance session for a given date. */
export async function submitAttendance(values: AttendanceRecordValues): Promise<string> {
  const counts = tally(values.records);
  // Best-effort only — never blocks attendance submission if the lookup fails.
  const classId = await resolveClassIdByName(values.className);
  return create(COLLECTIONS.attendance, { ...values, ...(classId ? { classId } : {}), ...counts });
}

export async function listAttendanceForClass(className: string): Promise<AttendanceDoc[]> {
  return getMany<Omit<AttendanceDoc, 'id'>>(COLLECTIONS.attendance, {
    where: [['className', '==', className]],
    orderBy: [['date', 'desc']],
    limit: 30,
  }) as Promise<AttendanceDoc[]>;
}

export async function listAttendanceForClasses(classNames: string[]): Promise<AttendanceDoc[]> {
  if (classNames.length === 0) return [];
  return getMany<Omit<AttendanceDoc, 'id'>>(COLLECTIONS.attendance, {
    where: [['className', 'in', classNames.slice(0, 10)]],
    orderBy: [['date', 'desc']],
    limit: 50,
  }) as Promise<AttendanceDoc[]>;
}
