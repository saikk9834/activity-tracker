import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react';
import type { Units } from '@/lib/units';

/** Same `sl_` prefix as the pre-account storage keys. */
const KEY = 'sl_units';

export interface UnitsStore {
  units: Units;
  setUnits: (units: Units) => void;
}

export const UnitsContext = createContext<UnitsStore | null>(null);

function read(): Units {
  try {
    return localStorage.getItem(KEY) === 'imperial' ? 'imperial' : 'metric';
  } catch {
    return 'metric';
  }
}

/**
 * The display-unit preference. Deliberately local to the device rather than a
 * profile column: it's a reading preference, not a body stat, and keeping it out
 * of the profile means toggling units never writes to the account.
 */
export function UnitsProvider({ children }: { children: ReactNode }) {
  const [units, setState] = useState<Units>(read);

  const setUnits = useCallback((next: Units) => {
    setState(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* private mode / quota — the in-memory preference still works */
    }
  }, []);

  const value = useMemo<UnitsStore>(() => ({ units, setUnits }), [units, setUnits]);

  return <UnitsContext.Provider value={value}>{children}</UnitsContext.Provider>;
}
