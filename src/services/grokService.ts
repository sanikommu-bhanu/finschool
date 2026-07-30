import { create, COLLECTIONS } from '@/services/firestore';

const GROK_ENDPOINT = 'https://api.x.ai/v1/chat/completions';
// xAI's mid-2026 flagship — override with VITE_GROK_MODEL if xAI renames/retires this slug later.
const DEFAULT_MODEL = 'grok-4.3';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export function isGrokConfigured(): boolean {
  return Boolean(import.meta.env.VITE_GROK_API_KEY);
}

/**
 * Calls the Grok chat-completions API directly from the browser.
 *
 * NOTE (security): this is a client-only app per the spec's tech stack (no backend function
 * listed), so the API key ships in the client bundle protected only by the key being
 * restricted to your own xAI account. For a production deployment where the key must stay
 * secret, proxy this call through a small Firebase Cloud Function instead of calling
 * api.x.ai directly from the browser.
 */
export async function askGrok(messages: ChatMessage[]): Promise<string> {
  const apiKey = import.meta.env.VITE_GROK_API_KEY;
  if (!apiKey) {
    throw new Error('Grok API key not configured. Add VITE_GROK_API_KEY to your .env file.');
  }

  const model = import.meta.env.VITE_GROK_MODEL || DEFAULT_MODEL;

  const res = await fetch(GROK_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.4,
      max_tokens: 700,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Grok API error (${res.status}): ${body.slice(0, 200) || res.statusText}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('Grok returned an empty response.');
  return content as string;
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
