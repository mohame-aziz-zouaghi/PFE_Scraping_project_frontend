// src/components/rag/BotBubble.tsx
import React, { useEffect, useState } from 'react';

interface Props {
  message: string;
  visible: boolean;
  onClose?: () => void;
  onClick?: () => void;
  variant?: 'greeting' | 'thinking';
}

const EXIT_MS = 300;

export function BotBubble({
  message,
  visible,
  onClose,
  onClick,
  variant = 'greeting',
}: Props) {
  const [rendered, setRendered] = useState(visible);

  useEffect(() => {
    if (visible) {
      setRendered(true);
    } else {
      const t = setTimeout(() => setRendered(false), EXIT_MS);
      return () => clearTimeout(t);
    }
  }, [visible]);

  if (!rendered) return null;

  const isThinking = variant === 'thinking';
  const interactive = !isThinking;

  return (
    <div
      className={`absolute bottom-full mb-3 left-0 w-[240px] ${
        visible && !isThinking ? 'animate-slide-up' : ''
      }`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(6px)',
        transition: `opacity ${EXIT_MS}ms ease-in-out, transform ${EXIT_MS}ms ease-in-out`,
      }}
    >
      <div className="relative">
        <div
          className="
            absolute -bottom-1.5 left-6 w-3 h-3
            bg-white border-l border-b border-gray-200
            rotate-[-45deg] origin-center
          "
        />
        <div
          onClick={interactive ? onClick : undefined}
          className={`
            relative bg-white rounded-2xl rounded-bl-sm
            border border-gray-200 shadow-lg
            px-3 py-2 ${interactive ? 'pr-6 cursor-pointer hover:shadow-xl' : ''}
            transition-shadow
          `}
          role={interactive ? 'button' : undefined}
          tabIndex={interactive ? 0 : undefined}
          onKeyDown={
            interactive && onClick
              ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') onClick();
                }
              : undefined
          }
        >
          <p
            className={`text-sm leading-snug ${
              isThinking ? 'text-gray-600 italic' : 'text-gray-800'
            }`}
          >
            {message}
            {isThinking && (
              <span className="inline-flex ml-0.5" aria-hidden="true">
                <span className="animate-thinking-dot" style={{ animationDelay: '0ms' }}>.</span>
                <span className="animate-thinking-dot" style={{ animationDelay: '160ms' }}>.</span>
                <span className="animate-thinking-dot" style={{ animationDelay: '320ms' }}>.</span>
              </span>
            )}
          </p>

          {interactive && onClose && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="
                absolute top-1.5 right-1.5
                w-5 h-5 rounded-full
                text-gray-400 hover:text-gray-700 hover:bg-gray-100
                flex items-center justify-center text-xs leading-none
              "
              aria-label="Dismiss"
            >
              ×
            </button>
          )}
        </div>
      </div>
    </div>
  );
}