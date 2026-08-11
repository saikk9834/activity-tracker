import { useEffect, useState } from 'react';

const VISIBLE_MS = 2600;

export function Toast({ message }: { message: string | null }) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!message) return;
    setShown(true);
    const t = window.setTimeout(() => setShown(false), VISIBLE_MS);
    return () => window.clearTimeout(t);
  }, [message]);

  return (
    <div id="toast" role="status" className={shown ? 'show' : ''}>
      {message}
    </div>
  );
}
