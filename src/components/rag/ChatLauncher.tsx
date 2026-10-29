// src/components/rag/ChatLauncher.tsx
import React, { useEffect, useRef, useState } from 'react';
import { BotAvatar } from './BotAvatar';
import { BotBubble } from './BotBubble';
import { ChatPanel } from './ChatPanel';
import {
  IDLE_NUDGES,
  INITIAL_GREETINGS,
  RETURN_GREETINGS,
  WAKE_GREETINGS,
  pickPhrase,
} from './phrases';
import { useIdleTimer } from './userIdleTimer';

const BOT_NAME = 'Sami';

const ENTRANCE_DELAY_MS = 600;
const WAVE_START_MS = 900;
const WAVE_DURATION_MS = 2200;
const GREETING_AFTER_WAVE_MS = 400;
const GREETING_AUTO_HIDE_MS = 5000;   // ← 5s (was 12s)
const GREETING_AFTER_CLOSE_MS = 800;

const IDLE_NUDGE_AFTER_MS = 45_000;
const SLEEP_AFTER_MS = 120_000;
const WAKE_GREETING_DELAY_MS = 400;

type Phase = 'loading' | 'waving' | 'idle';

export function ChatLauncher() {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>('loading');
  const [showGreeting, setShowGreeting] = useState(false);
  const [greetingText, setGreetingText] = useState<string>('');

  const [greetedOnce, setGreetedOnce] = useState(false);
  const [waking, setWaking] = useState(false);

  // Refs to prevent loops and remember last-used phrase per channel.
  const lastInitial = useRef<string | undefined>(undefined);
  const lastReturn = useRef<string | undefined>(undefined);
  const lastNudge = useRef<string | undefined>(undefined);
  const lastWake = useRef<string | undefined>(undefined);
  // Guard: "have we already nudged for this idle cycle?"
  const nudgedThisCycle = useRef(false);

  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Idle detection ─────────────────────────────────────
  const { state: idleState } = useIdleTimer({
    idleAfterMs: IDLE_NUDGE_AFTER_MS,
    sleepAfterMs: SLEEP_AFTER_MS,
    paused: open || !greetedOnce,
  });

  // ── Reset the nudge guard whenever the user leaves idle ─
  useEffect(() => {
    if (idleState !== 'idle') {
      nudgedThisCycle.current = false;
    }
  }, [idleState]);

  // ── Nudge on idle (once per idle cycle) ────────────────
  useEffect(() => {
    if (idleState !== 'idle') return;
    if (open || !greetedOnce) return;
    if (nudgedThisCycle.current) return;

    nudgedThisCycle.current = true;

    const text = pickPhrase(IDLE_NUDGES, lastNudge.current);
    lastNudge.current = text;
    setGreetingText(text);
    setShowGreeting(true);

    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(
      () => setShowGreeting(false),
      GREETING_AUTO_HIDE_MS,
    );
  }, [idleState, open, greetedOnce]);

  // ── Wake greeting when returning from asleep ───────────
  const prevIdleState = useRef(idleState);
  useEffect(() => {
    const wasAsleep = prevIdleState.current === 'asleep';
    prevIdleState.current = idleState;

    if (wasAsleep && idleState === 'active' && !open) {
      setWaking(true);
      const t = setTimeout(() => {
        const text = pickPhrase(WAKE_GREETINGS, lastWake.current);
        lastWake.current = text;
        setGreetingText(text);
        setShowGreeting(true);
        setWaking(false);

        if (hideTimer.current) clearTimeout(hideTimer.current);
        hideTimer.current = setTimeout(
          () => setShowGreeting(false),
          GREETING_AUTO_HIDE_MS,
        );
      }, WAKE_GREETING_DELAY_MS);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idleState, open]);

  // ── Entrance sequence ──────────────────────────────────
  useEffect(() => {
    if (greetedOnce || open) return;

    const t1 = setTimeout(() => setPhase('waving'), WAVE_START_MS);
    const t2 = setTimeout(
      () => setPhase('idle'),
      WAVE_START_MS + WAVE_DURATION_MS,
    );
    const t3 = setTimeout(() => {
      const text = pickPhrase(
        INITIAL_GREETINGS,
        lastInitial.current,
      );
      lastInitial.current = text;
      setGreetingText(text);
      setShowGreeting(true);
      setGreetedOnce(true);
      hideTimer.current = setTimeout(
        () => setShowGreeting(false),
        GREETING_AUTO_HIDE_MS,
      );
    }, WAVE_START_MS + WAVE_DURATION_MS + GREETING_AFTER_WAVE_MS);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [greetedOnce, open]);

  // ── Re-greet after panel close ─────────────────────────
  const closeChat = () => {
    setOpen(false);
    if (!greetedOnce) return;
    setTimeout(() => {
      const text = pickPhrase(
        RETURN_GREETINGS,
        lastReturn.current,
      );
      lastReturn.current = text;
      setGreetingText(text);
      setShowGreeting(true);
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(
        () => setShowGreeting(false),
        GREETING_AUTO_HIDE_MS,
      );
    }, GREETING_AFTER_CLOSE_MS);
  };

  const openChat = () => {
    setOpen(true);
    setShowGreeting(false);
    setWaking(false);
    if (hideTimer.current) clearTimeout(hideTimer.current);
  };

  // ── Avatar state ───────────────────────────────────────
  // `Phase` is 'loading' | 'waving' | 'idle' — no 'thinking'
  // branch here (that arrives in Phase 2 with real API calls).
  const avatarState: React.ComponentProps<typeof BotAvatar>['state'] =
    idleState === 'asleep'
      ? 'asleep'
      : waking
      ? 'nudging'
      : idleState === 'idle'
      ? 'nudging'
      : phase === 'waving'
      ? 'waving'
      : 'idle';

  return (
    <>
      {!open && (
        <div
          className={`fixed bottom-6 left-6 z-40 ${
            phase === 'loading' ? 'animate-fade-in' : ''
          }`}
        >
          <BotBubble
            message={greetingText}
            visible={showGreeting}
            onClose={() => {
              setShowGreeting(false);
              if (hideTimer.current) clearTimeout(hideTimer.current);
            }}
            onClick={openChat}
          />
          <button
            onClick={openChat}
            className="
              relative flex items-center justify-center
              hover:scale-105 active:scale-95
              transition-transform rounded-full
              focus:outline-none focus:ring-4 focus:ring-blue-300
            "
            aria-label={`Open ${BOT_NAME}`}
          >
            <BotAvatar size={80} state={avatarState} />
          </button>
        </div>
      )}

      {open && (
        <div
          className="
            fixed z-50 bg-white
            bottom-4 left-4
            w-[380px] h-[560px]
            rounded-2xl shadow-2xl
            overflow-hidden flex flex-col
            animate-slide-in
            max-sm:bottom-0 max-sm:left-0 max-sm:right-0
            max-sm:w-full max-sm:h-full max-sm:rounded-none
          "
          role="dialog"
          aria-label={`Chat with ${BOT_NAME}`}
        >
          <ChatPanel onClose={closeChat} />
        </div>
      )}
    </>
  );
}