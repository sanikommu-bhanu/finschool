import { z } from 'zod';

export const announcementSchema = z.object({
  className: z.string().trim().min(1, 'Select a class or "All"'),
  title: z.string().trim().min(2, 'Enter a title'),
  message: z.string().trim().min(2, 'Enter a message'),
  teacherName: z.string().min(1),
  // Optional — populated best-effort by createAnnouncement() via resolveClassIdByName()
  // (left unset for the "All" target, which has no single class). Additive only;
  // listAnnouncementsForClasses() still filters on className, unchanged.
  classId: z.string().optional(),
});

export type AnnouncementFormValues = z.infer<typeof announcementSchema>;

export interface AnnouncementDoc extends AnnouncementFormValues {
  id: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export const defaultAnnouncementValues: Omit<AnnouncementFormValues, 'teacherName'> = {
  className: 'All',
  title: '',
  message: '',
};
