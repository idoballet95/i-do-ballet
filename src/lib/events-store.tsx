'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { WorkoutEvent } from '@/types';
import { mockEvents } from '@/data/mock';

const STORAGE_KEY = 'idoballet_events_v2';

interface EventsCtx {
  events: WorkoutEvent[];
  addEvent: (e: WorkoutEvent) => void;
  updateEvent: (e: WorkoutEvent) => void;
}

const Ctx = createContext<EventsCtx | null>(null);

export function EventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<WorkoutEvent[]>(mockEvents);

  // hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setEvents(JSON.parse(raw));
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mockEvents));
      }
    } catch {}
  }, []);

  const addEvent = useCallback((e: WorkoutEvent) => {
    setEvents((prev) => {
      const next = [...prev, e];
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const updateEvent = useCallback((e: WorkoutEvent) => {
    setEvents((prev) => {
      const next = prev.map((ev) => (ev.id === e.id ? e : ev));
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  return (
    <Ctx.Provider value={{ events, addEvent, updateEvent }}>
      {children}
    </Ctx.Provider>
  );
}

export function useEvents() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useEvents must be used within EventsProvider');
  return ctx;
}
