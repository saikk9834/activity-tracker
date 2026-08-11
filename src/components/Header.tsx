import { useState } from 'react';
import { FlameIcon } from './icons';
import { useAuth } from '@/state/useAuth';

export function Header({ streak }: { streak: number }) {
  const { session, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const onSignOut = () => {
    setSigningOut(true);
    void signOut().catch(() => setSigningOut(false));
  };

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
          <span className="acct-email" title={session.user.email ?? ''}>
            {session.user.email}
          </span>
          <button type="button" className="linkbtn" onClick={onSignOut} disabled={signingOut}>
            {signingOut ? 'signing out…' : 'sign out'}
          </button>
        </div>
      )}
      <div className="lane" aria-hidden="true" />
    </header>
  );
}
