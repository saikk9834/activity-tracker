/** Quiet placeholder while the session is checked or data is migrating. */
export function Splash({ message }: { message?: string }) {
  return (
    <div className="splash" role="status">
      <div className="lane" aria-hidden="true" />
      <p className="small muted">{message ?? 'Loading…'}</p>
    </div>
  );
}
