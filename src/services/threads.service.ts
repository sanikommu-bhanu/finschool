import {
  collection,
  doc,
  writeBatch,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getMany, create, subscribe, COLLECTIONS } from '@/services/firestore';
import type { ThreadDoc, ThreadParticipant, MessageDoc } from '@/schemas/message.schema';

/**
 * All reads/writes for `threads` and its `messages` subcollection go through here —
 * same split of responsibility as notifications.service.ts (this file owns Firestore
 * shape/queries; hooks/useThreads.ts owns loading state + wiring to components).
 *
 * `create`/`getMany`/`subscribe` from services/firestore.ts take a plain path string, and
 * Firestore's collection() accepts multi-segment paths, so passing `threads/{id}/messages`
 * straight through works for the subcollection without any changes to that shared helper.
 */

function messagesPath(threadId: string): string {
  return `${COLLECTIONS.threads}/${threadId}/messages`;
}

/** Live list of threads the signed-in user is a participant in, most-recently-updated first. */
export function subscribeThreadsForEmail(
  email: string,
  cb: (threads: ThreadDoc[]) => void,
  onError?: (err: Error) => void
) {
  if (!email) {
    cb([]);
    return () => {};
  }
  return subscribe<Omit<ThreadDoc, 'id'>>(
    COLLECTIONS.threads,
    { where: [['participantEmails', 'array-contains', email]], orderBy: [['updatedAt', 'desc']] },
    (items) => cb(items as ThreadDoc[]),
    onError
  );
}

/** Live message log for one open thread, oldest first (chat order). */
export function subscribeThreadMessages(
  threadId: string,
  cb: (messages: MessageDoc[]) => void,
  onError?: (err: Error) => void
) {
  if (!threadId) {
    cb([]);
    return () => {};
  }
  return subscribe<Omit<MessageDoc, 'id'>>(
    messagesPath(threadId),
    { orderBy: [['createdAt', 'asc']] },
    (items) => cb(items as MessageDoc[]),
    onError
  );
}

/**
 * Finds an existing 1:1 thread between `me` and `other`, or creates one.
 * Firestore can only array-contains on one value per query, so we filter the
 * (small, per-user) candidate set client-side for an exact 2-participant match —
 * fine at this scale, and avoids a denormalized "pairKey" field for a v1 model.
 */
export async function getOrCreateThreadWith(me: ThreadParticipant, other: ThreadParticipant): Promise<ThreadDoc> {
  const candidates = (await getMany<Omit<ThreadDoc, 'id'>>(COLLECTIONS.threads, {
    where: [['participantEmails', 'array-contains', me.email]],
  })) as ThreadDoc[];

  const existing = candidates.find(
    (t) => t.participantEmails.length === 2 && t.participantEmails.includes(other.email)
  );
  if (existing) return existing;

  const participantEmails = [me.email, other.email].sort();
  const id = await create<Omit<ThreadDoc, 'id'>>(COLLECTIONS.threads, {
    participantEmails,
    participants: [me, other],
    lastMessage: '',
    lastSenderEmail: '',
    unreadBy: [],
  });

  return { id, participantEmails, participants: [me, other], lastMessage: '', lastSenderEmail: '', unreadBy: [] };
}

/** Sends a message: writes the message doc and updates the thread's preview/unread state in one batch,
 *  so a dropped connection can never leave the inbox preview out of sync with the message log. */
export async function sendThreadMessage(thread: ThreadDoc, sender: ThreadParticipant, text: string): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;

  const batch = writeBatch(db);
  const messageRef = doc(collection(db, messagesPath(thread.id)));
  const threadRef = doc(db, COLLECTIONS.threads, thread.id);
  const recipients = thread.participantEmails.filter((e) => e !== sender.email);

  batch.set(messageRef, {
    senderId: sender.email,
    senderName: sender.name,
    text: trimmed,
    readBy: [sender.email],
    createdAt: serverTimestamp(),
  });

  batch.update(threadRef, {
    lastMessage: trimmed,
    lastSenderEmail: sender.email,
    unreadBy: arrayUnion(...recipients),
    updatedAt: serverTimestamp(),
  });

  await batch.commit();
}

/** Marks a thread read for the signed-in user: clears them from the thread's unreadBy, and
 *  stamps readBy on any of that thread's messages they hadn't yet read. */
export async function markThreadRead(threadId: string, email: string, unreadMessageIds: string[]): Promise<void> {
  if (!threadId || !email) return;
  const batch = writeBatch(db);
  batch.update(doc(db, COLLECTIONS.threads, threadId), { unreadBy: arrayRemove(email) });
  unreadMessageIds.forEach((id) => {
    batch.update(doc(db, messagesPath(threadId), id), { readBy: arrayUnion(email) });
  });
  await batch.commit();
}
