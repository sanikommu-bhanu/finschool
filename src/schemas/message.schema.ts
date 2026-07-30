/** Firestore doc shapes for threaded messaging: `threads/{threadId}` and `threads/{threadId}/messages/{messageId}`. */

/** Minimal, denormalized identity snapshot stored on a thread so the inbox list can render
 *  names/avatars without an extra read per participant. */
export interface ThreadParticipant {
  email: string;
  name: string;
  avatar: string;
}

export interface ThreadDoc {
  id: string;
  /** Sorted list of participant emails — the array-contains target for "my threads" queries. */
  participantEmails: string[];
  participants: ThreadParticipant[];
  lastMessage: string;
  lastSenderEmail: string;
  /** Emails of participants who have unread messages in this thread. Cleared for a user when they open it. */
  unreadBy: string[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface MessageDoc {
  id: string;
  senderId: string; // participant email
  senderName: string;
  text: string;
  readBy: string[];
  createdAt?: unknown;
}
