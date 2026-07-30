import { getMany, create, update, remove, subscribe, COLLECTIONS } from '@/services/firestore';

export type NotificationType = 'fee_reminder' | 'attendance' | 'assignment' | 'announcement' | 'payment' | 'system';

export interface NotificationDoc {
  id: string;
  targetEmail: string;
  title: string;
  description: string;
  type: NotificationType;
  read: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export async function createNotification(data: Omit<NotificationDoc, 'id' | 'read' | 'createdAt' | 'updatedAt'>): Promise<string> {
  return create(COLLECTIONS.notifications, { ...data, read: false });
}

/** Fans out the same notification to many recipients (e.g. a class-wide fee reminder). Firestore has no batch-fanout helper here, so this issues one write per recipient. */
export async function createNotificationsForMany(
  emails: string[],
  data: Omit<NotificationDoc, 'id' | 'read' | 'createdAt' | 'updatedAt' | 'targetEmail'>
): Promise<void> {
  await Promise.all(emails.filter(Boolean).map((targetEmail) => createNotification({ ...data, targetEmail })));
}

export async function listNotificationsForEmail(email: string): Promise<NotificationDoc[]> {
  if (!email) return [];
  return getMany<Omit<NotificationDoc, 'id'>>(COLLECTIONS.notifications, {
    where: [['targetEmail', '==', email]],
    orderBy: [['createdAt', 'desc']],
    limit: 50,
  }) as Promise<NotificationDoc[]>;
}

export async function markNotificationRead(id: string): Promise<void> {
  return update(COLLECTIONS.notifications, id, { read: true });
}

export async function markAllNotificationsRead(ids: string[]): Promise<void> {
  await Promise.all(ids.map((id) => update(COLLECTIONS.notifications, id, { read: true })));
}

export async function deleteNotification(id: string): Promise<void> {
  return remove(COLLECTIONS.notifications, id);
}

/** Live subscription so the notification center / unread badge update in real time without a manual refetch. */
export function subscribeNotificationsForEmail(
  email: string,
  cb: (items: NotificationDoc[]) => void,
  onError?: (err: Error) => void
) {
  if (!email) {
    cb([]);
    return () => {};
  }
  return subscribe<Omit<NotificationDoc, 'id'>>(
    COLLECTIONS.notifications,
    { where: [['targetEmail', '==', email]], orderBy: [['createdAt', 'desc']], limit: 50 },
    (items) => cb(items as NotificationDoc[]),
    onError
  );
}
