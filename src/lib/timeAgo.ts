import type { Timestamp } from 'firebase/firestore';

/** Accepts a Firestore Timestamp, Date, ISO string, or the `serverTimestamp()` sentinel (null while pending). */
export function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  const ts = value as Partial<Timestamp>;
  if (typeof ts?.toDate === 'function') return ts.toDate();
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/** Formats a timestamp as "10:30 AM" (today), "Yesterday", or "3 May 2026" — matches the existing card design. */
export function formatNotificationTime(value: unknown): string {
  const date = toDate(value);
  if (!date) return 'Just now';

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  if (isYesterday) return 'Yesterday';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const formatTimeAgo = formatNotificationTime;
