import type { CoachTurn } from './coach';
import { supabase } from './supabase';

/**
 * Reads and writes `coach_chats` — see supabase/migrations/0005_coach_chats.sql.
 *
 * The rules that shape this module:
 *   * `id` (the row's `session_id`) is minted in the browser, so the first
 *     insert and every later update target the same row.
 *   * exactly one un-bookmarked chat per user. That row is the working chat the
 *     Coach tab restores on every open; bookmarking is what keeps a chat around
 *     once a new one is started.
 */

/** Matches `char_length(chat_name) <= 120` on the table. */
export const MAX_CHAT_NAME_LENGTH = 120;

export interface ChatSession {
  /** The row's `session_id`. */
  id: string;
  name: string;
  turns: CoachTurn[];
  bookmarked: boolean;
  /** False until the row has actually been inserted. */
  persisted: boolean;
  updatedAt: string | null;
}

interface ChatRow {
  session_id: string;
  chat_name: string;
  chat: unknown;
  bookmark: boolean;
  updated_at: string;
}

function fail(context: string, error: { message: string } | null): void {
  if (error) throw new Error(`${context}: ${error.message}`);
}

/** A brand-new, unsaved working chat. */
export function newChatSession(): ChatSession {
  return {
    id: crypto.randomUUID(),
    name: '',
    turns: [],
    bookmarked: false,
    persisted: false,
    updatedAt: null,
  };
}

/**
 * Names a chat after the question that started it — "Should I add weight to my
 * squat?" reads better in the bookmark list than a timestamp.
 */
export function titleFor(turns: CoachTurn[]): string {
  const first = turns.find((t) => t.role === 'user')?.content.trim() ?? '';
  if (!first) return 'New chat';
  const oneLine = first.replace(/\s+/g, ' ');
  return oneLine.length > MAX_CHAT_NAME_LENGTH
    ? `${oneLine.slice(0, MAX_CHAT_NAME_LENGTH - 1)}…`
    : oneLine;
}

/** jsonb comes back as `unknown`; anything that isn't a turn list is dropped. */
function toTurns(value: unknown): CoachTurn[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): CoachTurn[] => {
    if (!item || typeof item !== 'object') return [];
    const { role, content } = item as { role?: unknown; content?: unknown };
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') return [];
    return [{ role, content }];
  });
}

function toSession(row: ChatRow): ChatSession {
  return {
    id: row.session_id,
    name: row.chat_name,
    turns: toTurns(row.chat),
    bookmarked: row.bookmark,
    persisted: true,
    updatedAt: row.updated_at,
  };
}

const COLUMNS = 'session_id, chat_name, chat, bookmark, updated_at';

/**
 * The chat to show when the Coach tab opens: the user's single un-bookmarked
 * conversation, or null when they don't have one yet.
 */
export async function loadWorkingChat(userId: string): Promise<ChatSession | null> {
  const { data, error } = await supabase
    .from('coach_chats')
    .select(COLUMNS)
    .eq('user_id', userId)
    .eq('bookmark', false)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  fail('Loading your last conversation', error);
  return data ? toSession(data as ChatRow) : null;
}

export async function loadBookmarkedChats(userId: string): Promise<ChatSession[]> {
  const { data, error } = await supabase
    .from('coach_chats')
    .select(COLUMNS)
    .eq('user_id', userId)
    .eq('bookmark', true)
    .order('updated_at', { ascending: false });
  fail('Loading your bookmarked chats', error);
  return (data ?? []).map((row) => toSession(row as ChatRow));
}

/**
 * Writes the conversation. Inserts the row the first time (`persisted` false)
 * and updates it on every message after that, so a chat survives leaving the
 * tab mid-conversation.
 */
export async function saveChat(
  userId: string,
  chat: ChatSession,
  userName: string,
): Promise<void> {
  const name = (chat.name || titleFor(chat.turns)).slice(0, MAX_CHAT_NAME_LENGTH);
  const now = new Date().toISOString();

  if (!chat.persisted) {
    const { error } = await supabase.from('coach_chats').insert({
      session_id: chat.id,
      user_id: userId,
      user_name: userName,
      chat_name: name,
      chat: chat.turns,
      bookmark: chat.bookmarked,
      created_at: now,
      updated_at: now,
    });
    fail('Saving this conversation', error);
    return;
  }

  const { error } = await supabase
    .from('coach_chats')
    .update({
      user_name: userName,
      chat_name: name,
      chat: chat.turns,
      updated_at: now,
    })
    .eq('user_id', userId)
    .eq('session_id', chat.id);
  fail('Saving this conversation', error);
}

/**
 * Flips the bookmark on one chat.
 *
 * Un-bookmarking moves the chat back into the working slot, and there can only
 * be one of those — so any other un-bookmarked chat is deleted first. Callers
 * confirm with the user before that happens.
 */
export async function setBookmark(userId: string, id: string, bookmark: boolean): Promise<void> {
  if (!bookmark) {
    const { error: clearError } = await supabase
      .from('coach_chats')
      .delete()
      .eq('user_id', userId)
      .eq('bookmark', false)
      .neq('session_id', id);
    fail('Clearing the previous working chat', clearError);
  }

  const { error } = await supabase
    .from('coach_chats')
    .update({ bookmark, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('session_id', id);
  fail(bookmark ? 'Bookmarking this chat' : 'Removing the bookmark', error);
}

export async function deleteChat(userId: string, id: string): Promise<void> {
  const { error } = await supabase
    .from('coach_chats')
    .delete()
    .eq('user_id', userId)
    .eq('session_id', id);
  fail('Deleting that chat', error);
}

/**
 * Drops the working chat so a fresh one can take the slot. Bookmarked chats are
 * untouched — that's the whole point of bookmarking one.
 */
export async function deleteWorkingChat(userId: string): Promise<void> {
  const { error } = await supabase
    .from('coach_chats')
    .delete()
    .eq('user_id', userId)
    .eq('bookmark', false);
  fail('Starting a new chat', error);
}
