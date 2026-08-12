import { useState } from 'react';
import { FlameIcon } from './icons';
import { useAuth } from '@/state/useAuth';
import { useTracker } from '@/state/useTracker';

interface Props {
  streak: number;
  onOpenProfile: () => void;
}

export function Header({ streak, onOpenProfile }: Props) {
  const { session, signOut } = useAuth();
  const { data } = useTracker();
  const [signingOut, setSigningOut] = useState(false);

  const onSignOut = () => {
    setSigningOut(true);
    void signOut().catch(() => setSigningOut(false));
  };

  const name = data.profile?.name.trim();
  const label = name || session?.user.email || '';

  return (
    <header className="app">
      <div className="brand">
        <h1>
          Streak<span>line</span>
        </h1>
        <div className="streak-badge" title="Current streak">
          <FlameIcon />
          <span>{streak}</span>
        </div>
      </div>
      <p className="sub">
        Your 12-week lean plan — YMCA pool + gym, vegetarian fuel, one X per day.
      </p>
      {session && (
        <div className="acct">
          <button
            type="button"
            className="linkbtn acct-email"
            onClick={onOpenProfile}
            title="Open your profile"
          >
            {label}
          </button>
          <button type="button" className="linkbtn" onClick={onSignOut} disabled={signingOut}>
            {signingOut ? 'signing out…' : 'sign out'}
          </button>
        </div>
      )}
      <div className="lane" aria-hidden="true" />
    </header>
  );
}
