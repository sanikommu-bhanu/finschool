import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { createNotification } from '@/services/notifications.service';
import type { StudentDoc } from '@/schemas/student.schema';

interface ReminderInput {
  student: Pick<StudentDoc, 'name' | 'className' | 'feeDue' | 'guardianEmail' | 'studentEmail'>;
}

/** Sends a fee-due reminder notification to a student's guardian (and the student, if they have a linked email). */
export function useSendFeeReminder() {
  return useMutation({
    mutationFn: async ({ student }: ReminderInput) => {
      const title = 'Fee payment reminder';
      const description = `₹${student.feeDue.toLocaleString('en-IN')} is due for ${student.name} (${student.className}). Please clear the balance soon.`;
      const targets = [student.guardianEmail, student.studentEmail].filter((e): e is string => !!e);
      if (targets.length === 0) throw new Error('No linked email on file for this student');
      await Promise.all(
        targets.map((targetEmail) => createNotification({ targetEmail, title, description, type: 'fee_reminder' }))
      );
    },
    onSuccess: (_r, { student }) => toast.success(`Reminder sent for ${student.name}`),
    onError: (err: Error) => toast.error(err.message || 'Could not send reminder'),
  });
}
