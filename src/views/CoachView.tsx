import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { askCoach, type CoachTurn } from '@/lib/coach';
import { useTracker } from '@/state/useTracker';
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

export function CoachView({ todayKey }: Props) {
  const { data } = useTracker();
  const [turns, setTurns] = useState<CoachTurn[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Keep the newest message in view as the conversation grows.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [turns, busy]);

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || busy) return;

    const next: CoachTurn[] = [...turns, { role: 'user', content: question }];
    setTurns(next);
    setDraft('');
    setError(null);
    setBusy(true);

    try {
      const reply = await askCoach(next, todayKey);
      setTurns([...next, { role: 'assistant', content: reply }]);
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

  const name = data.profile?.name.trim();

  return (
    <div className="chat">
      <div className="chat-log" role="log" aria-live="polite" aria-label="Conversation">
        {turns.length === 0 && (
          <div className="card chat-intro">
            <p className="eyebrow">Coach</p>
            <h2>{name ? `Ask away, ${name}.` : 'Ask about your training.'}</h2>
            <p className="small muted">
              It can see your plan, your logged days, your streak, your working weights and your
              profile — so ask about those rather than things it has no way to know.
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

        {turns.map((turn, i) => (
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
                  const last = turns[turns.length - 1];
                  if (last?.role === 'user') {
                    setTurns(turns.slice(0, -1));
                    void send(last.content);
                  }
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
    </div>
  );
}
