import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react';
import { Celebration } from '@/components/Celebration';
import { Toast } from '@/components/Toast';
import type { Milestone } from '@/types';

export interface Feedback {
  showToast: (message: string) => void;
  celebrate: (milestone: Milestone) => void;
}

export const FeedbackContext = createContext<Feedback | null>(null);

/** Owns the two transient UI surfaces: the toast pill and the milestone modal. */
export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ message: string; id: number } | null>(null);
  const [milestone, setMilestone] = useState<Milestone | null>(null);

  const showToast = useCallback((message: string) => {
    setToast({ message, id: Date.now() });
  }, []);

  const celebrate = useCallback((m: Milestone) => setMilestone(m), []);

  const value = useMemo<Feedback>(() => ({ showToast, celebrate }), [showToast, celebrate]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      {milestone && <Celebration milestone={milestone} onClose={() => setMilestone(null)} />}
      <Toast key={toast?.id} message={toast?.message ?? null} />
    </FeedbackContext.Provider>
  );
}
