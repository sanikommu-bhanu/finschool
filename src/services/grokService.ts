import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { create, COLLECTIONS } from '@/services/firestore';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const askGrokCallable = httpsCallable<{ messages: ChatMessage[] }, { content: string }>(functions, 'askGrok');

/**
 * Calls the Grok chat-completions API via the `askGrok` Cloud Function
 * (functions/src/index.ts), which holds the xAI API key server-side. The key
 * must never ship in the client bundle — anyone can read it out of devtools on
 * a deployed site otherwise.
 */
export async function askGrok(messages: ChatMessage[]): Promise<string> {
  const result = await askGrokCallable({ messages });
  const content = result.data?.content;
  if (!content) throw new Error('Grok returned an empty response.');
  return content;
}

/** Every AI question/answer is logged to Firestore per the spec's `aiLogs` collection. */
export async function logAIInteraction(params: {
  userEmail: string;
  role: string;
  prompt: string;
  response: string;
  feature: string;
}): Promise<void> {
  try {
    await create(COLLECTIONS.aiLogs, params);
  } catch {
    // Logging is best-effort — never block the chat experience on a log write failing.
  }
}
