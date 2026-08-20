import { useContext } from 'react';
import { UnitsContext, type UnitsStore } from './UnitsProvider';

export function useUnits(): UnitsStore {
  const store = useContext(UnitsContext);
  if (!store) throw new Error('useUnits must be used inside <UnitsProvider>');
  return store;
}
