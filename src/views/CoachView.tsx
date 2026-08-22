import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import {
  deleteChat,
  deleteWorkingChat,
  loadBookmarkedChats,
  loadWorkingChat,
  newChatSession,
  saveChat,
  setBookmark,
  titleFor,
  type ChatSession,
} from '@/lib/chats';
import { askCoach, type CoachTurn } from '@/lib/coach';
import { useAuth } from '@/state/useAuth';
import { useTracker } from '@/state/useTracker';
import { useUnits } from '@/state/useUnits';
import type { ISODate } from '@/types';

const SUGGESTIONS = [
  'What am I doing today?',
  'How has my streak been this month?',
  'Should I add weight to my squat?',
  'I only have 20 minutes — what should I cut?',
];

interface Props {
  todayKey: ISODate;
}

/** Which half of the tab is showing: the conversation, or the bookmark list. */
type Pane = 'chat' | 'saved';

/** A destructive action waiting on the user to confirm it. */
type Pending = 'new' | 'unbookmark' | null;

export function CoachView({ todayKey }: Props) {
  const { session } = useAuth();
  const { data } = useTracker();
  const { units } = useUnits();

  const userId = session?.user.id ?? null;
  const name = data.profile?.name.trim();
  const userName = name || session?.user.email || '';

  const [chat, setChat] = useState<ChatSession>(newChatSession);
  const [restoring, setRestoring] = useState(true);
  const [pane, setPane] = useState<Pane>('chat');
  const [bookmarks, setBookmarks] = useState<ChatSession[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending>(null);

  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  /**
   * The stored working chat — the one un-bookmarked row this user is allowed.
   * Tracked separately from `chat` because opening a bookmark leaves it behind
   * in the database, and starting a new chat has to discard it either way.
   */
  const [workingId, setWorkingId] = useState<string | null>(null);

  const endRef = useRef<HTMLDivElement>(null);
  /** Chat ids known to have a row, so a save knows to insert or to update. */
  const savedIds = useRef(new Set<string>());
  /** Every write goes through here, so the insert can't race the first update. */
  const queue = useRef<Promise<void>>(Promise.resolve());

  const run = useCallback((task: () => Promise<void>): Promise<void> => {
    queue.current = queue.current
      .catch(() => undefined)
      .then(task)
      .then(() => setSaveError(null))
      .catch((err: unknown) => setSaveError(describe(err)));
    return queue.current;
  }, []);

  // Restore the working chat, so leaving the tab and coming back doesn't wipe
  // the conversation. Runs once per signed-in user.
  useEffect(() => {
    if (!userId) {
      setRestoring(false);
      return;
    }
    let active = true;
    setRestoring(true);
    loadWorkingChat(userId)
      .then((found) => {
        if (!active || !found) return;
        savedIds.current.add(found.id);
        setChat(found);
        setWorkingId(found.id);
      })
      .catch((err: unknown) => {
        if (active) setSaveError(describe(err));
      })
      .finally(() => {
        if (active) setRestoring(false);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  // Keep the newest message in view as the conversation grows.
  useEffect(() => {
    if (pane === 'chat') endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [chat.turns, busy, pane]);

  /** Inserts the row the first time this chat is written, updates it after. */
  const persist = useCallback(
    (next: ChatSession) => {
      if (!userId) return;
      void run(async () => {
        await saveChat(userId, { ...next, persisted: savedIds.current.has(next.id) }, userName);
        savedIds.current.add(next.id);
        // The row exists now, so the bookmark switch has something to flip.
        setChat((c) => (c.id === next.id ? { ...c, persisted: true } : c));
        if (!next.bookmarked) setWorkingId(next.id);
      });
    },
    [userId, userName, run],
  );

  const send = async (text: string, base: ChatSession = chat) => {
    const question = text.trim();
    if (!question || busy) return;

    const turns: CoachTurn[] = [...base.turns, { role: 'user', content: question }];
    const asked: ChatSession = { ...base, turns, name: base.name || titleFor(turns) };
    setChat(asked);
    setDraft('');
    setError(null);
    setBusy(true);
    // Saved before the round trip: if the reply fails, or the user switches
    // tabs mid-answer, the question is still on record.
    persist(asked);

    try {
      const reply = await askCoach(turns, todayKey, units);
      const answered: ChatSession = {
        ...asked,
        turns: [...turns, { role: 'assistant', content: reply }],
      };
      setChat(answered);
      persist(answered);
    } catch (err) {
      // The question stays on screen so it can be retried without retyping.
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void send(draft);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send(draft);
    }
  };

  /** True when starting a new chat would throw away an unsaved conversation. */
  const wouldDiscard = workingId !== null;

  const startNewChat = () => {
    setPending(null);
    setChat(newChatSession());
    setDraft('');
    setError(null);
    setPane('chat');
    setWorkingId(null);
    if (!userId) return;
    // Frees the single working slot; bookmarked chats are untouched.
    void run(() => deleteWorkingChat(userId));
  };

  const applyBookmark = (next: boolean) => {
    if (!userId) return;
    setPending(null);
    setChat((c) => ({ ...c, bookmarked: next }));
    // Bookmarking frees the working slot; un-bookmarking claims it.
    setWorkingId(next ? (workingId === chat.id ? null : workingId) : chat.id);
    if (!next) setBookmarks((list) => list.filter((s) => s.id !== chat.id));
    void run(() => setBookmark(userId, chat.id, next));
  };

  const toggleBookmark = () => {
    if (!userId || !chat.persisted) return;
    const next = !chat.bookmarked;

    // Un-bookmarking puts this chat back in the working slot, and only one chat
    // fits there — so the working chat left behind elsewhere goes. Ask first.
    if (!next && workingId !== null && workingId !== chat.id) {
      setPending('unbookmark');
      return;
    }

    applyBookmark(next);
  };

  const showSaved = () => {
    setPane('saved');
    setPending(null);
    if (!userId) return;
    setLoadingSaved(true);
    void loadBookmarkedChats(userId)
      .then((list) => {
        setBookmarks(list);
        setSaveError(null);
      })
      .catch((err: unknown) => setSaveError(describe(err)))
      .finally(() => setLoadingSaved(false));
  };

  const openSaved = (saved: ChatSession) => {
    savedIds.current.add(saved.id);
    setChat(saved);
    setPane('chat');
    setPending(null);
    setError(null);
    setDraft('');
  };

  const removeSaved = (id: string) => {
    if (!userId) return;
    setConfirmDelete(null);
    setBookmarks((list) => list.filter((s) => s.id !== id));
    if (chat.id === id) {
      savedIds.current.delete(id);
      setChat(newChatSession());
    }
    void run(() => deleteChat(userId, id));
  };

  return (
    <div className="chat">
      <div className="chat-bar">
        <div className="chat-panes" role="tablist" aria-label="Coach view">
          <button
            type="button"
            role="tab"
            aria-selected={pane === 'chat'}
            className={pane === 'chat' ? 'on' : ''}
            onClick={() => setPane('chat')}
          >
            Chat
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={pane === 'saved'}
            className={pane === 'saved' ? 'on' : ''}
            onClick={showSaved}
          >
            Bookmarked
          </button>
        </div>

        <div className="chat-actions">
          <button
            type="button"
            className="switch"
            role="switch"
            aria-checked={chat.bookmarked}
            aria-label="Bookmark this chat"
            disabled={!chat.persisted || busy}
            title={
              chat.persisted
                ? 'Keep this conversation in your bookmarks'
                : 'Ask something first'
            }
            onClick={toggleBookmark}
          >
            <span className="switch-track" aria-hidden="true">
              <span className="switch-knob" />
            </span>
            <span>Bookmark</span>
          </button>
          <button
            type="button"
            className="linkbtn"
            disabled={busy}
            onClick={() => (wouldDiscard ? setPending('new') : startNewChat())}
          >
            new chat
          </button>
        </div>
      </div>

      {pending === 'new' && (
        <div className="alert" role="alert">
          <span>
            Starting a new chat discards your current unsaved conversation. Bookmark it first
            if you want to keep it.
          </span>
          <span className="alert-actions">
            <button type="button" className="linkbtn" onClick={startNewChat}>
              discard &amp; start
            </button>
            <button type="button" className="linkbtn" onClick={() => setPending(null)}>
              cancel
            </button>
          </span>
        </div>
      )}

      {pending === 'unbookmark' && (
        <div className="alert" role="alert">
          <span>
            Removing the bookmark makes this your working chat — the unsaved one you had
            before will be discarded.
          </span>
          <span className="alert-actions">
            <button type="button" className="linkbtn" onClick={() => applyBookmark(false)}>
              remove anyway
            </button>
            <button type="button" className="linkbtn" onClick={() => setPending(null)}>
              cancel
            </button>
          </span>
        </div>
      )}

      {saveError && (
        <p className="small muted chat-savenote" role="status">
          {saveError}
        </p>
      )}

      {pane === 'saved' ? (
        <SavedList
          chats={bookmarks}
          loading={loadingSaved}
          activeId={chat.id}
          confirmDelete={confirmDelete}
          onOpen={openSaved}
          onAskDelete={setConfirmDelete}
          onDelete={removeSaved}
        />
      ) : (
        <>
          <div className="chat-log" role="log" aria-live="polite" aria-label="Conversation">
            {restoring && chat.turns.length === 0 && (
              <p className="small muted">Loading your conversation…</p>
            )}

            {!restoring && chat.turns.length === 0 && (
              <div className="card chat-intro">
                <p className="eyebrow">Coach</p>
                <h2>Ask about your training{name ? `, ${name}` : ''}.</h2>
                <p className="small muted">
                  It can see your plan, your logged days, your streak, your working weights and
                  your profile — so ask about those rather than things it has no way to know.
                </p>
                <div className="chat-suggestions">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} type="button" className="chip-btn" onClick={() => void send(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {chat.turns.map((turn, i) => (
              <div key={i} className={`bubble ${turn.role}`}>
                {turn.content}
              </div>
            ))}

            {busy && (
              <div className="bubble assistant thinking" aria-label="Coach is typing">
                <span />
                <span />
                <span />
              </div>
            )}

            {error && (
              <div className="alert" role="alert">
                <span>{error}</span>
                <span className="alert-actions">
                  <button
                    type="button"
                    className="linkbtn"
                    onClick={() => {
                      const last = chat.turns[chat.turns.length - 1];
                      if (last?.role !== 'user') return;
                      const trimmed = { ...chat, turns: chat.turns.slice(0, -1) };
                      setChat(trimmed);
                      void send(last.content, trimmed);
                    }}
                  >
                    retry
                  </button>
                </span>
              </div>
            )}

            <div ref={endRef} />
          </div>

          <form className="chat-input" onSubmit={onSubmit}>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask about today's session, your streak, your weights…"
              rows={1}
              aria-label="Message the coach"
              disabled={busy}
            />
            <button type="submit" className="btn" disabled={busy || !draft.trim()}>
              {busy ? '…' : 'Ask'}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

interface SavedListProps {
  chats: ChatSession[];
  loading: boolean;
  activeId: string;
  confirmDelete: string | null;
  onOpen: (chat: ChatSession) => void;
  onAskDelete: (id: string | null) => void;
  onDelete: (id: string) => void;
}

function SavedList({
  chats,
  loading,
  activeId,
  confirmDelete,
  onOpen,
  onAskDelete,
  onDelete,
}: SavedListProps) {
  if (loading && chats.length === 0) return <p className="small muted">Loading bookmarks…</p>;

  if (chats.length === 0) {
    return (
      <div className="card chat-intro">
        <p className="eyebrow">Bookmarks</p>
        <h2>Nothing saved yet.</h2>
        <p className="small muted">
          Flip the Bookmark switch on a conversation to keep it here. Everything else is
          replaced the next time you start a new chat.
        </p>
      </div>
    );
  }

  return (
    <ul className="saved-list">
      {chats.map((saved) => (
        <li key={saved.id} className={`saved-item${saved.id === activeId ? ' current' : ''}`}>
          <button type="button" className="saved-open" onClick={() => onOpen(saved)}>
            <span className="saved-name">{saved.name || 'Untitled chat'}</span>
            <span className="small muted">
              {saved.turns.length} message{saved.turns.length === 1 ? '' : 's'}
              {saved.updatedAt ? ` · ${formatDate(saved.updatedAt)}` : ''}
            </span>
          </button>
          {confirmDelete === saved.id ? (
            <span className="saved-actions">
              <button type="button" className="linkbtn" onClick={() => onDelete(saved.id)}>
                delete
              </button>
              <button type="button" className="linkbtn" onClick={() => onAskDelete(null)}>
                cancel
              </button>
            </span>
          ) : (
            <span className="saved-actions">
              <button type="button" className="linkbtn" onClick={() => onAskDelete(saved.id)}>
                remove
              </button>
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function describe(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  return /failed to fetch|network/i.test(message)
    ? 'Lost the connection — this conversation may not have saved.'
    : message;
}
