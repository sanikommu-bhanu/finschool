import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineChevronLeft, HiOutlineSparkles, HiOutlinePaperAirplane } from 'react-icons/hi';
import { Screen } from '@/components/layout/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { useAIAssistant, SUGGESTED_PROMPTS } from '@/hooks/useAIAssistant';
import clsx from 'clsx';

export default function AIAssistant() {
  const navigate = useNavigate();
  const { messages, sendMessage, isSending, snapshot } = useAIAssistant();
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const handleSend = () => {
    if (!input.trim() || isSending) return;
    sendMessage(input);
    setInput('');
  };

  return (
    <Screen withNav={false} className="flex flex-col h-screen">
      <div className="flex items-center gap-2 mb-4 shrink-0">
        <button onClick={() => navigate(-1)} className="glass-pill w-9 h-9 flex items-center justify-center">
          <HiOutlineChevronLeft size={18} />
        </button>
        <div className="w-9 h-9 rounded-full bg-gradient-cta flex items-center justify-center shrink-0">
          <HiOutlineSparkles size={16} className="text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="font-display text-lg font-semibold truncate">AI Financial Assistant</h1>
          <p className="text-[11px] text-blush-700/60 dark:text-blush-200/50 truncate">
            {snapshot ? `${snapshot.totalStudents} students · Rs. ${snapshot.totalPendingFees.toLocaleString('en-IN')} pending` : 'Loading live data…'}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 min-h-0 -mx-1 px-1">
        {messages.length === 0 && (
          <div className="space-y-2.5">
            <GlassCard padding="sm" className="text-xs text-blush-700/70 dark:text-blush-200/60">
              Ask me about fee collection, revenue trends, overdue classes, or ask me to draft a parent reminder — I read live Firestore data before answering.
            </GlassCard>
            <div className="grid grid-cols-2 gap-2">
              {SUGGESTED_PROMPTS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => sendMessage(s.prompt)}
                  disabled={isSending}
                  className="glass-card text-left text-xs font-semibold p-3 active:scale-95 transition-transform disabled:opacity-50"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={clsx('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div
              className={clsx(
                'max-w-[85%] rounded-xl3 px-3.5 py-2.5 text-sm whitespace-pre-wrap',
                m.role === 'user' ? 'bg-gradient-cta text-white' : 'glass-card',
                m.error && 'border border-red-300/60 text-red-600 dark:text-red-300'
              )}
            >
              {m.content}
            </div>
          </div>
        ))}

        {isSending && (
          <div className="flex justify-start">
            <div className="glass-card px-3.5 py-2.5 text-sm flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blush-500 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-blush-500 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-blush-500 animate-bounce" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="shrink-0 pt-3 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about fees, revenue, reminders…"
          className="flex-1 glass-input text-sm px-4 py-3 rounded-full"
        />
        <button
          onClick={handleSend}
          disabled={isSending || !input.trim()}
          className="w-11 h-11 rounded-full bg-gradient-cta flex items-center justify-center text-white shrink-0 disabled:opacity-40 active:scale-90 transition-transform"
          aria-label="Send"
        >
          <HiOutlinePaperAirplane size={18} className="rotate-90" />
        </button>
      </div>
    </Screen>
  );
}
