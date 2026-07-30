import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { listAnnouncementsForClasses, createAnnouncement, deleteAnnouncement } from '@/services/announcements.service';
import { listStudentsForCollection } from '@/services/payments.service';
import { createNotificationsForMany } from '@/services/notifications.service';
import type { AnnouncementFormValues } from '@/schemas/announcement.schema';

export function useAnnouncementsForClasses(classNames: string[]) {
  return useQuery({
    queryKey: ['announcements', classNames],
    queryFn: () => listAnnouncementsForClasses(classNames),
    enabled: classNames.length > 0,
    staleTime: 20_000,
  });
}

export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: AnnouncementFormValues) => {
      const id = await createAnnouncement(data);
      try {
        const students = await listStudentsForCollection();
        const emails = students
          .filter(s => data.className === 'All' || s.className === data.className)
          .flatMap(s => [s.studentEmail, s.guardianEmail])
          .filter((e): e is string => !!e);
        if (emails.length > 0) {
          await createNotificationsForMany(emails, {
            title: `New Announcement: ${data.title}`,
            description: data.message.substring(0, 50) + (data.message.length > 50 ? '...' : ''),
            type: 'announcement'
          });
        }
      } catch (err) {
        console.error('Failed to notify students:', err);
      }
      return id;
    },
    onSuccess: () => {
      toast.success('Announcement posted and students notified');
      qc.invalidateQueries({ queryKey: ['announcements'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Could not post announcement'),
  });
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAnnouncement(id),
    onSuccess: () => {
      toast.success('Announcement removed');
      qc.invalidateQueries({ queryKey: ['announcements'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Could not remove announcement'),
  });
}
