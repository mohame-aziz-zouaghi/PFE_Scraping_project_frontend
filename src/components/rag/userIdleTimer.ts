// src/components/rag/useIdleTimer.ts
import { useEffect, useRef, useState } from 'react';

export type IdleState = 'active' | 'idle' | 'asleep';

interface Options {
  /** ms of inactivity before entering 'idle'. */
  idleAfterMs: number;
  /** ms of inactivity before entering 'asleep'. Must be > idleAfterMs. */
  sleepAfterMs: number;
  /** If true, the timer is paused (e.g. while the chat panel is open). */
  paused?: boolean;
}

/**
 * Tracks user activity and returns one of three states.
 *
 *   active  — recent interaction
 *   idle    — no interaction for `idleAfterMs`
 *   asleep  — no interaction for `sleepAfterMs`
 *
 * Transitions back to 'active' on any mouse move, key press,
 * scroll, or touch. The transition to 'asleep' fires the
 * `onFallAsleep` callback exactly once; the transition back to
 * 'active' fires `onWake` exactly once.
 */
export function useIdleTimer(options: Options): {
  state: IdleState;
  reset: () => void;
} {
  const { idleAfterMs, sleepAfterMs, paused = false } = options;

  const [state, setState] = useState<IdleState>('active');
  const lastActivityRef = useRef<number>(Date.now());
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sleepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef<IdleState>('active');

  // Keep stateRef in sync so event handlers can read it without
  // re-registering listeners.
  stateRef.current = state;

  const reset = () => {
    lastActivityRef.current = Date.now();
    if (stateRef.current !== 'active') {
      setState('active');
    }
    armTimers();
  };

  const armTimers = () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
    if (paused) return;

    idleTimerRef.current = setTimeout(() => {
      // Only transition to 'idle' if we're currently 'active'.
      if (stateRef.current === 'active') setState('idle');
    }, idleAfterMs);

    sleepTimerRef.current = setTimeout(() => {
      setState('asleep');
    }, sleepAfterMs);
  };

  useEffect(() => {
    if (paused) {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
      // While paused, force state back to active so the bot
      // doesn't sleep behind an open chat.
      if (stateRef.current !== 'active') setState('active');
      return;
    }

    const onActivity = () => reset();
    const events: (keyof DocumentEventMap)[] = [
      'mousemove',
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'wheel',
    ];
    events.forEach((e) => {
      window.addEventListener(e, onActivity, { passive: true });
    });

    // Arm the timers on mount.
    armTimers();

    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, idleAfterMs, sleepAfterMs]);

  return { state, reset };
}