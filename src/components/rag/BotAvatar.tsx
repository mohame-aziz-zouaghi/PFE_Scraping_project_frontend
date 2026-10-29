// src/components/rag/BotAvatar.tsx
import React from 'react';

interface Props {
  size?: number;
  state?: 'idle' | 'thinking' | 'waving' | 'nudging' | 'asleep';
}

export function BotAvatar({ size = 80, state = 'idle' }: Props) {
  const wrapperClass =
    state === 'thinking'
      ? 'animate-pulse-fast'
      : state === 'asleep'
      ? 'animate-breathe'
      : 'animate-bob';

  const armClass =
    state === 'waving' || state === 'nudging'
      ? 'animate-arm-swing'
      : 'animate-arm-rest';

  const asleep = state === 'asleep';

  return (
    <div
      className={`relative select-none ${wrapperClass}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 96 96"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-lg overflow-visible"
      >
        {/* ── Antenna ─────────────────────────────── */}
        <line
          x1="48" y1="8" x2="48" y2="18"
          stroke="#374151" strokeWidth="2" strokeLinecap="round"
        />
        <circle
          cx="48" cy="6" r="3.5"
          fill={asleep ? '#9ca3af' : '#3b82f6'}
          style={{ transition: 'fill 0.4s ease-in-out' }}
          className={asleep ? '' : 'animate-blink'}
        />

        {/* ── Torso ───────────────────────────────── */}
        <rect
          x="42" y="58" width="12" height="6" rx="1"
          fill="#9ca3af" stroke="#374151" strokeWidth="1.5"
        />
        <path
          d="
            M 24 70
            Q 24 66 28 65
            L 68 65
            Q 72 66 72 70
            L 74 88
            Q 74 90 72 90
            L 24 90
            Q 22 90 22 88
            Z
          "
          fill="#e5e7eb"
          stroke="#374151"
          strokeWidth="2"
        />
        <circle
          cx="48" cy="78" r="3"
          fill={asleep ? '#9ca3af' : '#10b981'}
          style={{ transition: 'fill 0.4s ease-in-out' }}
          className={asleep ? '' : 'animate-glow'}
        />

        {/* ── Head (smoothly tilts via CSS transition) ─ */}
        <g
          style={{
            transform: asleep
              ? 'rotate(8deg)'
              : 'rotate(0deg)',
            transformOrigin: '48px 62px',
            transition: 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <rect
            x="20" y="22" width="56" height="40" rx="10"
            fill="#e5e7eb" stroke="#374151" strokeWidth="2"
          />

          {/* Eyes — both states overlaid, cross-faded by opacity
              so nothing snaps. */}
          {/* Open-eye group: visible when awake */}
          <g
            style={{
              opacity: asleep ? 0 : 1,
              transition: 'opacity 0.4s ease-in-out',
            }}
          >
            <circle cx="36" cy="38" r="4.5" fill="#1f2937" />
            <circle cx="37" cy="36.5" r="1.4" fill="#ffffff" />
            <circle cx="60" cy="38" r="4.5" fill="#1f2937" />
            <circle cx="61" cy="36.5" r="1.4" fill="#ffffff" />
          </g>
          {/* Closed-eye group: visible when asleep */}
          <g
            style={{
              opacity: asleep ? 1 : 0,
              transition: 'opacity 0.4s ease-in-out',
            }}
          >
            <path
              d="M 32 38 Q 36 41 40 38"
              fill="none" stroke="#1f2937"
              strokeWidth="2" strokeLinecap="round"
            />
            <path
              d="M 56 38 Q 60 41 64 38"
              fill="none" stroke="#1f2937"
              strokeWidth="2" strokeLinecap="round"
            />
          </g>

          {/* Smile */}
          <path
            d="M 38 50 Q 48 56 58 50"
            fill="none" stroke="#374151"
            strokeWidth="2" strokeLinecap="round"
          />

          {/* Ears */}
          <rect
            x="15" y="34" width="5" height="14" rx="2.5"
            fill="#9ca3af" stroke="#374151" strokeWidth="1.5"
          />
          <rect
            x="76" y="34" width="5" height="14" rx="2.5"
            fill="#9ca3af" stroke="#374151" strokeWidth="1.5"
          />
        </g>

        {/* ── LEFT ARM ─────────────────────────────── */}
        <g
          className="animate-arm-rest-left"
          style={{ transformOrigin: '26px 70px' }}
        >
          <circle cx="26" cy="70" r="3.5"
            fill="#9ca3af" stroke="#374151" strokeWidth="1.5" />
          <rect x="23" y="70" width="6" height="14" rx="3"
            fill="#e5e7eb" stroke="#374151" strokeWidth="1.5" />
          <circle cx="26" cy="84" r="2.8"
            fill="#e5e7eb" stroke="#374151" strokeWidth="1.5" />
          <rect x="23" y="84" width="6" height="10" rx="3"
            fill="#e5e7eb" stroke="#374151" strokeWidth="1.5" />
          <circle cx="26" cy="96" r="4"
            fill="#e5e7eb" stroke="#374151" strokeWidth="1.5" />
          <rect x="21.5" y="96" width="1.6" height="4" rx="0.8"
            fill="#e5e7eb" stroke="#374151" strokeWidth="1" />
          <rect x="24.5" y="96" width="1.6" height="4.5" rx="0.8"
            fill="#e5e7eb" stroke="#374151" strokeWidth="1" />
          <rect x="27.5" y="96" width="1.6" height="4" rx="0.8"
            fill="#e5e7eb" stroke="#374151" strokeWidth="1" />
          <ellipse cx="31" cy="94" rx="1.6" ry="2.4"
            fill="#e5e7eb" stroke="#374151" strokeWidth="1.2" />
        </g>

        {/* ── RIGHT ARM ────────────────────────────── */}
        <g
          className={armClass}
          style={{ transformOrigin: '70px 70px' }}
        >
          <circle cx="70" cy="70" r="3.5"
            fill="#9ca3af" stroke="#374151" strokeWidth="1.5" />
          <rect x="67" y="70" width="6" height="14" rx="3"
            fill="#e5e7eb" stroke="#374151" strokeWidth="1.5" />
          <circle cx="70" cy="84" r="2.8"
            fill="#e5e7eb" stroke="#374151" strokeWidth="1.5" />
          <rect x="67" y="84" width="6" height="10" rx="3"
            fill="#e5e7eb" stroke="#374151" strokeWidth="1.5" />
          <circle cx="70" cy="96" r="4"
            fill="#e5e7eb" stroke="#374151" strokeWidth="1.5" />
          <rect x="65.5" y="96" width="1.6" height="4" rx="0.8"
            fill="#e5e7eb" stroke="#374151" strokeWidth="1" />
          <rect x="68.5" y="96" width="1.6" height="4.5" rx="0.8"
            fill="#e5e7eb" stroke="#374151" strokeWidth="1" />
          <rect x="71.5" y="96" width="1.6" height="4" rx="0.8"
            fill="#e5e7eb" stroke="#374151" strokeWidth="1" />
          <ellipse cx="75" cy="94" rx="1.6" ry="2.4"
            fill="#e5e7eb" stroke="#374151" strokeWidth="1.2" />
        </g>
      </svg>

      {/* ── Zzz indicator (only when asleep) ──────
          Positioned above Sami's head. Lives OUTSIDE the SVG
          so it moves with the body's breathing animation
          (which is applied to the wrapper div). */}
      {asleep && (
        <div
          className="absolute pointer-events-none"
          style={{
            top: '2px',
            right: '6px',
            color: '#1e40af',
            fontWeight: 700,
            fontFamily: 'system-ui, sans-serif',
          }}
          aria-hidden="true"
        >
          <span
            className="animate-zzz-1 inline-block"
            style={{ fontSize: '11px', opacity: 0 }}
          >
            z
          </span>
          <span
            className="animate-zzz-2 inline-block"
            style={{ fontSize: '13px', opacity: 0 }}
          >
            z
          </span>
          <span
            className="animate-zzz-3 inline-block"
            style={{ fontSize: '15px', opacity: 0 }}
          >
            Z
          </span>
        </div>
      )}
    </div>
  );
}