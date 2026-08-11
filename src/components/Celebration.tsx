import { useEffect } from 'react';
import { Confetti } from './Confetti';
import type { Milestone } from '@/types';

interface Props {
  milestone: Milestone;
  onClose: () => void;
}

export function Celebration({ milestone, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div id="celebrate" className="show" role="dialog" aria-modal="true" aria-label="Milestone reached">
      <div className="scrim" onClick={onClose} />
      <Confetti />
      <div className="cel-card">
        <div className="big">{milestone.days}</div>
        <div className="lbl">{milestone.days === 1 ? 'first day logged' : 'day streak'}</div>
        <p className="q">{milestone.quote}</p>
        <button type="button" className="btn" autoFocus onClick={onClose}>
          Keep going
        </button>
      </div>
    </div>
  );
}
