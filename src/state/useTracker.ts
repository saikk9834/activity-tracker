import { useContext } from 'react';
import { TrackerContext, type TrackerStore } from './TrackerProvider';

export function useTracker(): TrackerStore {
  const store = useContext(TrackerContext);
  if (!store) throw new Error('useTracker must be used inside <TrackerProvider>');
  return store;
}
