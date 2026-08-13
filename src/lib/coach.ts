import { supabase } from './supabase';
import type { ISODate } from '@/types';

export interface CoachTurn {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Calls `/api/chat`, the Vercel Function that talks to Claude. Same origin as
 * the app, so no CORS involved.
 *
 * The Anthropic API key lives only in Vercel's environment variables — it is
 * never shipped to the browser. The access token sent here is the user's
 * Supabase session token, which the function uses to read their rows under
 * row-level security.
 */
export async function askCoach(messages: CoachTurn[], today: ISODate): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Your session expired — sign in again.');

  let response: Response;
  try {
    response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ messages, today }),
    });
  } catch {
    throw new Error('Could not reach the coach. Check your connection.');
  }

  // The function reports failures as JSON, including on non-2xx.
  const payload = (await response.json().catch(() => null)) as {
    reply?: string;
    error?: string;
  } | null;

  if (payload?.error) throw new Error(payload.error);
  if (!response.ok) throw new Error(`The coach failed (HTTP ${response.status}).`);
  if (!payload?.reply) throw new Error('The coach came back empty.');
  return payload.reply;
}
