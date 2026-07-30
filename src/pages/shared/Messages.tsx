import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { HiOutlineChevronLeft, HiOutlinePencilAlt, HiOutlinePaperAirplane, HiOutlineChatAlt2 } from 'react-icons/hi';
import { Screen } from '@/components/layout/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { Fab } from '@/components/ui/Fab';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { useThreads, useThreadMessages, useSendMessage, useMarkThreadRead, useStartThread } from '@/hooks/useThreads';
import { formatNotificationTime } from '@/lib/timeAgo';
import type { ThreadDoc, ThreadParticipant } from '@/schemas/message.schema';

/** Location state Search.tsx passes when the user taps "Message" on a person — opens (or creates) that thread. */
interface StartThreadState {
  startThreadWith?: ThreadParticipant;
}

export default function Messages() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);

  const { threads, isLoading, error } = useThreads();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const active = threads.find((t) => t.id === activeId) ?? null;
  const { messages: chatLog, isLoading: chatLoading } = useThreadMessages(activeId);
  const sendMessage = useSendMessage();
  const markRead = useMarkThreadRead();
  const startThread = useStartThread();

  const me: ThreadParticipant | null = user ? { email: user.email, name: user.name, avatar: user.avatar } : null;

  const otherParticipant = (t: ThreadDoc): ThreadParticipant | undefined =>
    t.participants.find((p) => p.email !== user?.email) ?? t.participants[0];

  const openThread = (t: ThreadDoc) => {
    setActiveId(t.id);
    if (user && t.unreadBy.includes(user.email)) {
      // Fire-and-forget: read receipts are best-effort and shouldn't block opening the thread.
      markRead.mutate({ threadId: t.id, email: user.email, unreadMessageIds: [] });
    }
  };

  // Once messages for the open thread arrive, sweep any still-unread-by-me messages.
  useEffect(() => {
    if (!active || !user) return;
    const unreadIds = chatLog.filter((m) => m.senderId !== user.email && !m.readBy.includes(user.email)).map((m) => m.id);
    if (unreadIds.length > 0) {
      markRead.mutate({ threadId: active.id, email: user.email, unreadMessageIds: unreadIds });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id, chatLog.length]);

  // Arriving from Search with "Message this person" — find/create the thread and open it.
  useEffect(() => {
    const state = location.state as StartThreadState | null;
    const other = state?.startThreadWith;
    if (!other || !me) return;
    startThread.mutate(
      { me, other },
      {
        onSuccess: (t) => {
          setActiveId(t.id);
          navigate(location.pathname, { replace: true, state: {} });
        },
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, me?.email]);

  const sendReply = () => {
    if (!active || !me || !draft.trim()) return;
    sendMessage.mutate({ thread: active, sender: me, text: draft.trim() });
    setDraft('');
  };

  return (
    <Screen withNav={false}>
      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => navigate(-1)} className="glass-pill w-9 h-9 flex items-center justify-center">
          <HiOutlineChevronLeft size={18} />
        </button>
        <h1 className="font-display text-lg font-semibold">Messages</h1>
      </div>

      {isLoading && (
        <div className="space-y-2.5">
          <Skeleton className="h-16 rounded-xl3" />
          <Skeleton className="h-16 rounded-xl3" />
          <Skeleton className="h-16 rounded-xl3" />
        </div>
      )}

      {!isLoading && error && (
        <EmptyState icon={HiOutlineChatAlt2} title="Couldn't load messages" description="Check your connection and try again." />
      )}

      {!isLoading && !error && threads.length === 0 && (
        <EmptyState
          icon={HiOutlineChatAlt2}
          title="No conversations yet"
          description="Find someone in Search and tap Message to start a conversation."
        />
      )}

      {!isLoading && !error && threads.length > 0 && (
        <div className="space-y-2.5">
          {threads.map((t) => {
            const other = otherParticipant(t);
            const unread = user ? t.unreadBy.includes(user.email) : false;
            return (
              <GlassCard key={t.id} padding="sm" className="flex items-center gap-3 cursor-pointer" onClick={() => openThread(t)}>
                <img
                  src={other?.avatar || `https://i.pravatar.cc/150?u=${t.id}`}
                  className="w-11 h-11 rounded-full object-cover shrink-0"
                  alt={other?.name || 'Conversation'}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-semibold truncate">{other?.name || 'Unknown'}</p>
                    <span className="text-[10px] text-blush-700/40 shrink-0">{formatNotificationTime(t.updatedAt)}</span>
                  </div>
                  <p className="text-xs text-blush-700/60 dark:text-blush-200/50 truncate">
                    {t.lastMessage || 'No messages yet'}
                  </p>
                </div>
                {unread && (
                  <span className="w-5 h-5 rounded-full bg-blush-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    •
                  </span>
                )}
              </GlassCard>
            );
          })}
        </div>
      )}

      <Fab
        icon={HiOutlinePencilAlt}
        label="New message"
        onClick={() => toast('Pick a recipient from Search to start a new thread', { icon: '💬' })}
      />

      <BottomSheet open={!!active} onClose={() => setActiveId(null)} title={active ? otherParticipant(active)?.name : undefined}>
        {active && (
          <div className="flex flex-col max-h-[60vh]">
            <div className="space-y-2 overflow-y-auto flex-1 mb-3 pr-1">
              {chatLoading && (
                <div className="space-y-2">
                  <Skeleton className="h-9 w-2/3 rounded-xl2" />
                  <Skeleton className="h-9 w-1/2 rounded-xl2 ml-auto" />
                </div>
              )}
              {!chatLoading && chatLog.length === 0 && (
                <p className="text-xs text-center text-blush-700/50 dark:text-blush-200/40 py-6">
                  Say hello — this is the start of your conversation.
                </p>
              )}
              {!chatLoading &&
                chatLog.map((c) => (
                  <div
                    key={c.id}
                    className={`max-w-[80%] px-3.5 py-2 rounded-xl2 text-sm ${
                      c.senderId === user?.email ? 'ml-auto bg-gradient-cta text-white' : 'glass'
                    }`}
                  >
                    {c.text}
                  </div>
                ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendReply()}
                placeholder="Type a message…"
                className="glass-input flex-1 px-4 py-3 text-sm"
              />
              <button
                onClick={sendReply}
                disabled={sendMessage.isPending}
                className="w-11 h-11 rounded-full bg-gradient-cta text-white flex items-center justify-center shrink-0 disabled:opacity-60"
              >
                <HiOutlinePaperAirplane size={16} className="rotate-90" />
              </button>
            </div>
          </div>
        )}
      </BottomSheet>
    </Screen>
  );
}
