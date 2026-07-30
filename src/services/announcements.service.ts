import { getMany, create, remove, COLLECTIONS } from '@/services/firestore';
import type { AnnouncementDoc, AnnouncementFormValues } from '@/schemas/announcement.schema';
import { resolveClassIdByName } from '@/services/academicStructure.service';

export async function listAnnouncementsForClasses(classNames: string[]): Promise<AnnouncementDoc[]> {
  const all = await getMany<AnnouncementFormValues>(COLLECTIONS.announcements, {
    orderBy: [['createdAt', 'desc']],
  }) as AnnouncementDoc[];
  // "All" targets every class — filter client-side since Firestore can't OR two different fields easily here.
  return all.filter((a) => a.className === 'All' || classNames.includes(a.className));
}

export async function createAnnouncement(data: AnnouncementFormValues): Promise<string> {
  // Best-effort only — resolveClassIdByName() already returns undefined for "All",
  // and never blocks announcement creation if the lookup fails.
  const classId = await resolveClassIdByName(data.className);
  return create(COLLECTIONS.announcements, classId ? { ...data, classId } : data);
}

export async function deleteAnnouncement(id: string): Promise<void> {
  return remove(COLLECTIONS.announcements, id);
}
