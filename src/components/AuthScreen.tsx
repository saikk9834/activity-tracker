import { useState, type FormEvent } from 'react';
import { FlameIcon } from './icons';
import { useAuth } from '@/state/useAuth';

type Mode = 'signin' | 'signup';

const MIN_PASSWORD = 6;

/** Supabase's messages are terse; these are the ones users actually hit. */
function friendlyError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/invalid login credentials/i.test(message)) return 'That email and password don’t match.';
  if (/email not confirmed/i.test(message))
    return 'Confirm your email first — check your inbox for the link.';
  if (/user already registered/i.test(message))
    return 'That email already has an account. Try signing in.';
  if (/failed to fetch|network/i.test(message))
    return 'Can’t reach the server. Check your connection and that VITE_SUPABASE_URL is right.';
  return message;
}

export function AuthScreen() {
  const { signIn, signUp, sendPasswordReset } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (mode === 'signup' && password.length < MIN_PASSWORD) {
      setError(`Password needs at least ${MIN_PASSWORD} characters.`);
      return;
    }

    setBusy(true);
    try {
      if (mode === 'signup') {
        const { needsEmailConfirmation } = await signUp(email, password);
        if (needsEmailConfirmation) {
          setNotice(`Account created. Check ${email} for a confirmation link, then sign in.`);
          setMode('signin');
          setPassword('');
        }
        // Otherwise the session lands and the auth gate swaps this screen out.
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async () => {
    setError(null);
    setNotice(null);
    if (!email) {
      setError('Enter your email first, then tap reset.');
      return;
    }
    setBusy(true);
    try {
      await sendPasswordReset(email);
      setNotice(`If ${email} has an account, a reset link is on its way.`);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setNotice(null);
  };

  return (
    <div className="auth-wrap">
      <div className="auth-brand">
        <h1>
          Streak<span>line</span>
        </h1>
        <div className="streak-badge" aria-hidden="true">
          <FlameIcon />
          <span>12</span>
        </div>
      </div>
      <p className="sub">
        {mode === 'signin'
          ? 'Sign in to pick up your streak.'
          : 'Create an account — your streak follows you to any device.'}
      </p>

      <div className="card auth-card">
        <div className="auth-tabs" role="tablist" aria-label="Account">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signin'}
            onClick={() => switchMode('signin')}
          >
            Sign in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signup'}
            onClick={() => switchMode('signup')}
          >
            Create account
          </button>
        </div>

        <form onSubmit={submit} noValidate>
          <label className="field">
            <span className="flabel">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              disabled={busy}
            />
          </label>

          <label className="field">
            <span className="flabel">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              minLength={mode === 'signup' ? MIN_PASSWORD : undefined}
              required
              disabled={busy}
            />
            {mode === 'signup' && (
              <span className="fhint">At least {MIN_PASSWORD} characters.</span>
            )}
          </label>

          {error && (
            <p className="auth-msg err" role="alert">
              {error}
            </p>
          )}
          {notice && (
            <p className="auth-msg ok" role="status">
              {notice}
            </p>
          )}

          <button type="submit" className="btn auth-submit" disabled={busy}>
            {busy ? 'Working…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        {mode === 'signin' && (
          <button type="button" className="linkbtn auth-reset" onClick={resetPassword} disabled={busy}>
            Forgot your password?
          </button>
        )}
      </div>

      <p className="small muted auth-foot">
        Anything you tracked on this device before signing up moves into your account
        automatically the first time you sign in.
      </p>
    </div>
  );
}
