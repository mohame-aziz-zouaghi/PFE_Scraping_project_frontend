// src/components/rag/ChatPanel.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useRagChat, Message } from '../../hooks/useRagChat';
import { sendFeedback } from '../../api/ragClient';
import { SourceCards } from './SourceCards';
import { FaqChips } from './FaqChips';
import { phraseForElapsed } from './thinkingPhrases';

interface Props {
  onClose: () => void;
  productName?: string | undefined;
}

export function ChatPanel({ onClose, productName }: Props) {
  const {
    messages,
    faq,
    sending,
    remaining,
    requiresAuth,
    error,
    initialized,
    send,
    setFeedback,
  } = useRagChat({ contextPrefix: productName });

  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages.length, sending]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || sending || requiresAuth) return;
    const text = input;
    setInput('');
    send(text);
  };

  // Feedback fires-and-forgets — we optimistically mark the UI,
  // then POST. Errors are swallowed (best-effort analytics).
  const handleFeedback = (id: string, feedback: 'up' | 'down') => {
    setFeedback(id, feedback);
    const msg = messages.find((m) => m.id === id);
    if (msg?.requestId) {
      sendFeedback(msg.requestId, feedback === 'up').catch(() => {
        /* best-effort */
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-500">
        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
          <svg viewBox="0 0 64 64" className="w-7 h-7">
            <circle cx="32" cy="6" r="3" fill="#ffffff" />
            <line x1="32" y1="8" x2="32" y2="16" stroke="#ffffff" strokeWidth="2" />
            <rect x="12" y="16" width="40" height="32" rx="8" fill="#ffffff" stroke="#1e40af" strokeWidth="2" />
            <circle cx="24" cy="30" r="4" fill="#1e40af" />
            <circle cx="40" cy="30" r="4" fill="#1e40af" />
            <path d="M 26 40 Q 32 44 38 40" fill="none" stroke="#1e40af" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white text-sm truncate">Sami</div>
          <div className="text-xs text-blue-100">
            Shopping assistant · powered by local AI
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-blue-100 hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center"
          aria-label="Close chat"
        >
          ×
        </button>
      </div>

      {/* Body */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 bg-gray-50">
        {!initialized && (
          <div className="text-center text-gray-400 text-sm py-8">Loading…</div>
        )}

        {messages.map((m) => (
          <MessageRow
            key={m.id}
            message={m}
            {...(!requiresAuth ? { onFeedback: handleFeedback } : {})}
          />
        ))}

        {messages.length === 1 && faq.length > 0 && (
          <FaqChips items={faq} onSelect={(q) => send(q)} disabled={sending} />
        )}

        {sending && <ThinkingRow />}

        {requiresAuth && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center text-sm">
            <div className="font-medium text-blue-900 mb-2">
              You've used all your free messages
            </div>
            <div className="text-blue-800 mb-3">
              Sign in to keep chatting — it's free.
            </div>
            <a
              href="/login"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Sign in
            </a>
          </div>
        )}

        {error && (
          <div className="mt-2 text-xs text-red-600 text-center">{error}</div>
        )}
      </div>

      {/* Composer */}
      {!requiresAuth && (
        <form onSubmit={handleSubmit} className="border-t border-gray-200 p-3 bg-white">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={
                productName
                  ? `Ask about ${productName}…`
                  : 'Ask a question…'
              }
              rows={1}
              disabled={sending}
              className="flex-1 resize-none border border-gray-300 rounded-xl px-3 py-2 text-sm leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 max-h-24"
              style={{ minHeight: '40px' }}
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              aria-label="Send message"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-[10px] text-gray-400">
              Sami may make mistakes. Verify prices on the store site.
            </span>
            {remaining != null && (
              <span
                className={`text-[10px] font-medium ${
                  remaining <= 2 ? 'text-orange-600' : 'text-gray-400'
                }`}
                aria-live="polite"
              >
                {remaining} free {remaining === 1 ? 'message' : 'messages'} left
              </span>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

// ── Message row ─────────────────────────────────────────
interface MessageRowProps {
  message: Message;
  onFeedback?: ((id: string, feedback: 'up' | 'down') => void) | undefined;
}

function MessageRow({ message, onFeedback }: MessageRowProps) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex mb-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-6 h-6 rounded-full bg-blue-600 flex-shrink-0 mr-2 mt-1">
          <svg viewBox="0 0 64 64" className="w-6 h-6">
            <rect x="12" y="16" width="40" height="32" rx="8" fill="#ffffff" stroke="#1e40af" strokeWidth="2" />
            <circle cx="24" cy="30" r="4" fill="#1e40af" />
            <circle cx="40" cy="30" r="4" fill="#1e40af" />
            <path d="M 26 40 Q 32 44 38 40" fill="none" stroke="#1e40af" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>
      )}
      <div
        className={`
          max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed
          whitespace-pre-wrap
          ${
            isUser
              ? 'bg-blue-600 text-white rounded-br-sm'
              : message.refused
              ? 'bg-yellow-50 text-yellow-900 border border-yellow-200 rounded-bl-sm'
              : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm'
          }
        `}
      >
        <div>{message.text}</div>

        {!isUser && message.sourceCards && message.sourceCards.length > 0 && (
          <SourceCards cards={message.sourceCards} />
        )}

        {!isUser && !message.refused && onFeedback && message.requestId && (
          <div className="flex gap-1 mt-1 justify-end">
            <button
              onClick={() => onFeedback(message.id, 'up')}
              className={`text-xs px-2 py-0.5 rounded ${
                message.feedback === 'up'
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              aria-label="Helpful"
            >
              👍
            </button>
            <button
              onClick={() => onFeedback(message.id, 'down')}
              className={`text-xs px-2 py-0.5 rounded ${
                message.feedback === 'down'
                  ? 'bg-red-100 text-red-700'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              aria-label="Not helpful"
            >
              👎
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Thinking row ────────────────────────────────────────
function ThinkingRow() {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const t = setInterval(() => setElapsed(Date.now() - start), 200);
    return () => clearInterval(t);
  }, []);

  const phrase = phraseForElapsed(elapsed);

  return (
    <div className="flex mb-3 justify-start">
      <div className="w-6 h-6 rounded-full bg-blue-600 flex-shrink-0 mr-2 mt-1">
        <svg viewBox="0 0 64 64" className="w-6 h-6">
          <rect x="12" y="16" width="40" height="32" rx="8" fill="#ffffff" stroke="#1e40af" strokeWidth="2" />
          <circle cx="24" cy="30" r="4" fill="#1e40af" />
          <circle cx="40" cy="30" r="4" fill="#1e40af" />
          <path d="M 26 40 L 38 40" fill="none" stroke="#1e40af" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </div>
      <div className="max-w-[80%] rounded-2xl rounded-bl-sm px-3.5 py-2 text-sm bg-white border border-gray-200 text-gray-600 italic">
        {phrase}
        <span className="inline-flex ml-0.5" aria-hidden="true">
          <span className="animate-thinking-dot" style={{ animationDelay: '0ms' }}>.</span>
          <span className="animate-thinking-dot" style={{ animationDelay: '160ms' }}>.</span>
          <span className="animate-thinking-dot" style={{ animationDelay: '320ms' }}>.</span>
        </span>
      </div>
    </div>
  );
}