import { z } from 'zod';

export const attendanceStatusSchema = z.enum(['present', 'absent', 'leave']);
export type AttendanceStatus = z.infer<typeof attendanceStatusSchema>;

export const attendanceRecordSchema = z.object({
  className: z.string().min(1, 'Select a class'),
  date: z.string().min(1), // YYYY-MM-DD
  teacherName: z.string().min(1),
  records: z.record(z.string(), attendanceStatusSchema), // studentId -> status
  // Optional — populated best-effort by submitAttendance() via resolveClassIdByName().
  // Additive only; listAttendanceForClass(es) still query on className, unchanged.
  classId: z.string().optional(),
});

export type AttendanceRecordValues = z.infer<typeof attendanceRecordSchema>;

export interface AttendanceDoc extends AttendanceRecordValues {
  id: string;
  presentCount: number;
  absentCount: number;
  leaveCount: number;
  totalCount: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}
