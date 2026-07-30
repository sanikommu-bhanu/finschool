import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  subscribeThreadsForEmail,
  subscribeThreadMessages,
  getOrCreateThreadWith,
  sendThreadMessage,
  markThreadRead,
} from '@/services/threads.service';
import type { ThreadDoc, ThreadParticipant, MessageDoc } from '@/schemas/message.schema';
import { useAuthStore } from '@/store/authStore';

/** Live (onSnapshot-backed) inbox for the signed-in user — same shape of hook as useNotifications. */
export function useThreads() {
  const email = useAuthStore((s) => s.user?.email);
  const [threads, setThreads] = useState<ThreadDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!email) {
      setThreads([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const unsubscribe = subscribeThreadsForEmail(
      email,
      (items) => {
        setThreads(items);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        setIsLoading(false);
        setError(err);
      }
    );
    return unsubscribe;
  }, [email]);

  const unreadThreadCount = threads.filter((t) => email && t.unreadBy.includes(email)).length;

  return { threads, isLoading, error, unreadThreadCount };
}

/** Live message log for one open thread. Pass null/'' to stay idle (e.g. no thread open yet). */
export function useThreadMessages(threadId: string | null) {
  const [messages, setMessages] = useState<MessageDoc[]>([]);
  const [isLoading, setIsLoading] = useState(!!threadId);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!threadId) {
      setMessages([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const unsubscribe = subscribeThreadMessages(
      threadId,
      (items) => {
        setMessages(items);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        setIsLoading(false);
        setError(err);
      }
    );
    return unsubscribe;
  }, [threadId]);

  return { messages, isLoading, error };
}

/** Finds-or-creates the 1:1 thread with another person (used by Search's "Message" action). */
export function useStartThread() {
  return useMutation({
    mutationFn: ({ me, other }: { me: ThreadParticipant; other: ThreadParticipant }) => getOrCreateThreadWith(me, other),
    onError: (err: Error) => toast.error(err.message || 'Could not start conversation'),
  });
}

export function useSendMessage() {
  return useMutation({
    mutationFn: ({ thread, sender, text }: { thread: ThreadDoc; sender: ThreadParticipant; text: string }) =>
      sendThreadMessage(thread, sender, text),
    onError: (err: Error) => toast.error(err.message || 'Message failed to send — please retry'),
  });
}

export function useMarkThreadRead() {
  return useMutation({
    mutationFn: ({ threadId, email, unreadMessageIds }: { threadId: string; email: string; unreadMessageIds: string[] }) =>
      markThreadRead(threadId, email, unreadMessageIds),
    // Silent on error — read-receipts are best-effort and shouldn't interrupt the user with a toast.
  });
}
