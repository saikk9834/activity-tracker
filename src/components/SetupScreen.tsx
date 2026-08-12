/** Shown instead of a blank page when `.env` has no Supabase credentials. */
export function SetupScreen() {
  return (
    <div className="auth-wrap">
      <div className="auth-brand">
        <h1>
          Streak<span>line</span>
        </h1>
      </div>
      <p className="sub">One step left before accounts work.</p>

      <div className="card">
        <p className="eyebrow">Setup</p>
        <h2>Connect a Supabase project</h2>
        <ol className="tight small">
          <li>
            Create a project at <span className="mono">supabase.com</span>.
          </li>
          <li>
            Run each file in <span className="mono">supabase/migrations/</span> in the SQL editor,
            in order.
          </li>
          <li>
            Create a <span className="mono">.env</span> with{' '}
            <span className="mono">VITE_SUPABASE_URL</span> and{' '}
            <span className="mono">VITE_SUPABASE_ANON_KEY</span> from <em>Project Settings → API</em>
            .
          </li>
          <li>
            Restart <span className="mono">npm run dev</span> — Vite only reads env files at
            startup.
          </li>
        </ol>
      </div>
    </div>
  );
}
