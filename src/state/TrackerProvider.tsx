import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  createRepository,
  EMPTY_DATA,
  MAX_NOTE_LENGTH,
  MAX_SUBSTITUTION_LENGTH,
  type TrackerData,
  type TrackerRepository,
} from '@/storage';
import type { ExerciseId, ISODate, Profile } from '@/types';

export interface TrackerStore {
  data: TrackerData;
  loading: boolean;
  /** Last read/write failure, e.g. the network dropped mid-save. */
  error: string | null;
  dismissError: () => void;
  reload: () => void;
  setDayDone: (date: ISODate, done: boolean) => void;
  toggleDay: (date: ISODate) => void;
  toggleCheck: (date: ISODate, exerciseId: ExerciseId) => ExerciseId[];
  /** Empty string clears the comment. */
  setNote: (date: ISODate, exerciseId: ExerciseId, note: string) => void;
  /** Replaces the day's scheduled session; empty string restores it. */
  setSubstitution: (date: ISODate, activity: string) => void;
  setWeight: (exerciseId: ExerciseId, weight: string) => void;
  setLink: (exerciseId: ExerciseId, url: string | null) => void;
  /** Rejects if the save fails, so the form can keep the user on the page. */
  saveProfile: (profile: Profile) => Promise<void>;
}

export const TrackerContext = createContext<TrackerStore | null>(null);

interface Props {
  children: ReactNode;
  /** Injected by the auth gate; falls back to local storage for tests. */
  repository?: TrackerRepository;
}

export function TrackerProvider({ children, repository }: Props) {
  const repo = useMemo(() => repository ?? createRepository(null), [repository]);
  const [data, setData] = useState<TrackerData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    repo
      .load()
      .then((loaded) => {
        if (cancelled) return;
        setData(loaded);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(describe(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [repo, reloadToken]);

  // Writes are optimistic: state updates immediately, persistence follows. If
  // the write fails the banner says so and `reload` pulls the truth back.
  const persist = useCallback((op: Promise<void>) => {
    op.catch((err: unknown) => setError(describe(err)));
  }, []);

  const setDayDone = useCallback(
    (date: ISODate, done: boolean) => {
      setData((prev) => {
        const next = { ...prev.done };
        if (done) next[date] = true;
        else delete next[date];
        return { ...prev, done: next };
      });
      persist(repo.setDayDone(date, done));
    },
    [repo, persist],
  );

  const toggleDay = useCallback(
    (date: ISODate) => {
      setData((prev) => {
        const done = !prev.done[date];
        persist(repo.setDayDone(date, done));
        const next = { ...prev.done };
        if (done) next[date] = true;
        else delete next[date];
        return { ...prev, done: next };
      });
    },
    [repo, persist],
  );

  /** Returns the resulting list so callers can react to "all items ticked". */
  const toggleCheck = useCallback(
    (date: ISODate, exerciseId: ExerciseId): ExerciseId[] => {
      const current = data.checks[date] ?? [];
      const next = current.includes(exerciseId)
        ? current.filter((id) => id !== exerciseId)
        : [...current, exerciseId];
      setData((prev) => ({ ...prev, checks: { ...prev.checks, [date]: next } }));
      persist(repo.setChecks(date, next));
      return next;
    },
    [data.checks, repo, persist],
  );

  const setNote = useCallback(
    (date: ISODate, exerciseId: ExerciseId, note: string) => {
      const trimmed = note.trim().slice(0, MAX_NOTE_LENGTH);
      setData((prev) => {
        const forDay = { ...prev.notes[date] };
        if (trimmed) forDay[exerciseId] = trimmed;
        else delete forDay[exerciseId];
        const notes = { ...prev.notes };
        if (Object.keys(forDay).length) notes[date] = forDay;
        else delete notes[date];
        return { ...prev, notes };
      });
      persist(repo.setNote(date, exerciseId, trimmed || null));
    },
    [repo, persist],
  );

  const setSubstitution = useCallback(
    (date: ISODate, activity: string) => {
      const trimmed = activity.trim().slice(0, MAX_SUBSTITUTION_LENGTH);
      setData((prev) => {
        const substitutions = { ...prev.substitutions };
        if (trimmed) substitutions[date] = trimmed;
        else delete substitutions[date];
        return { ...prev, substitutions };
      });
      persist(repo.setSubstitution(date, trimmed || null));
    },
    [repo, persist],
  );

  const setWeight = useCallback(
    (exerciseId: ExerciseId, weight: string) => {
      setData((prev) => ({ ...prev, weights: { ...prev.weights, [exerciseId]: weight } }));
      persist(repo.setWeight(exerciseId, weight));
    },
    [repo, persist],
  );

  const setLink = useCallback(
    (exerciseId: ExerciseId, url: string | null) => {
      setData((prev) => {
        const links = { ...prev.links };
        if (url) links[exerciseId] = url;
        else delete links[exerciseId];
        return { ...prev, links };
      });
      persist(repo.setLink(exerciseId, url));
    },
    [repo, persist],
  );

  // Not optimistic, unlike the rest: the profile form has an explicit save
  // button, so it waits for the round trip and reports failure in place.
  const saveProfile = useCallback(
    async (profile: Profile) => {
      await repo.saveProfile(profile);
      setData((prev) => ({ ...prev, profile }));
    },
    [repo],
  );

  const dismissError = useCallback(() => setError(null), []);
  const reload = useCallback(() => {
    setError(null);
    setReloadToken((n) => n + 1);
  }, []);

  const value = useMemo<TrackerStore>(
    () => ({
      data,
      loading,
      error,
      dismissError,
      reload,
      setDayDone,
      toggleDay,
      toggleCheck,
      setNote,
      setSubstitution,
      setWeight,
      setLink,
      saveProfile,
    }),
    [
      data,
      loading,
      error,
      dismissError,
      reload,
      setDayDone,
      toggleDay,
      toggleCheck,
      setNote,
      setSubstitution,
      setWeight,
      setLink,
      saveProfile,
    ],
  );

  return <TrackerContext.Provider value={value}>{children}</TrackerContext.Provider>;
}

function describe(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  return /failed to fetch|network/i.test(message)
    ? 'Lost the connection — your last change may not have saved.'
    : message;
}
