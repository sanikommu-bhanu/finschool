import { useState, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { buildSchoolSnapshot, formatSnapshotForPrompt } from '@/services/aiContext.service';
import { askGrok, logAIInteraction, type ChatMessage } from '@/services/grokService';
import { useAuthStore } from '@/store/authStore';

export interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  error?: boolean;
}

const SYSTEM_PROMPT = `You are the Smart School FinTech AI Financial Assistant, built into the school's admin dashboard.
You help school administrators and accountants with: revenue insights, fee collection predictions,
natural-language search over fee/student records, smart suggestions for improving collection, and drafting
fee reminder messages. Be concise, use Rupee (Rs.) formatting, and structure multi-point answers with short
bullet points. Only use the live data snapshot you're given — never invent numbers.`;

export const SUGGESTED_PROMPTS = [
  { label: 'Revenue insights', prompt: 'Give me a summary of our fee collection performance and any concerning trends.' },
  { label: 'Fee prediction', prompt: 'Based on current dues and collection patterns, predict how much we should expect to collect next month.' },
  { label: 'Overdue classes', prompt: 'Which classes have the highest overdue fees and what should we prioritize?' },
  { label: 'Draft a reminder', prompt: 'Draft a polite fee reminder message I can send to parents with overdue fees.' },
];

export function useSchoolSnapshot() {
  return useQuery({
    queryKey: ['ai-school-snapshot'],
    queryFn: buildSchoolSnapshot,
    staleTime: 60_000,
  });
}

export function useAIAssistant() {
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const { data: snapshot, refetch: refetchSnapshot } = useSchoolSnapshot();

  const mutation = useMutation({
    mutationFn: async (userText: string) => {
      const freshSnapshot = snapshot ?? (await refetchSnapshot()).data;
      const contextBlock = freshSnapshot ? formatSnapshotForPrompt(freshSnapshot) : 'No live data available right now.';

      const history: ChatMessage[] = [
        { role: 'system', content: `${SYSTEM_PROMPT}\n\n${contextBlock}` },
        ...messages.map((m): ChatMessage => ({ role: m.role, content: m.content })),
        { role: 'user', content: userText },
      ];

      const reply = await askGrok(history);

      if (user?.email) {
        void logAIInteraction({ userEmail: user.email, role: role || 'unknown', prompt: userText, response: reply, feature: 'chat' });
      }

      return reply;
    },
  });

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const userMsg: DisplayMessage = { id: `${Date.now()}-u`, role: 'user', content: trimmed };
      setMessages((prev) => [...prev, userMsg]);

      try {
        const reply = await mutation.mutateAsync(trimmed);
        setMessages((prev) => [...prev, { id: `${Date.now()}-a`, role: 'assistant', content: reply }]);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Something went wrong talking to the AI assistant.';
        setMessages((prev) => [...prev, { id: `${Date.now()}-e`, role: 'assistant', content: message, error: true }]);
      }
    },
    [mutation]
  );

  return {
    messages,
    sendMessage,
    isSending: mutation.isPending,
    snapshot,
  };
}
