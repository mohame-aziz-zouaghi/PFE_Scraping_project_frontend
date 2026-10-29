// src/hooks/useRagChat.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChatResponse,
  FaqItem,
  SourceCard,
  chat,
  getFaq,
} from '../api/ragClient';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  sourceCards?: SourceCard[];
  refused?: boolean;
  requestId?: string;
  feedback?: 'up' | 'down';
}

interface UseRagChatOptions {
  /** `undefined` is allowed explicitly because callers may
   *  pass `productName` which is `string | undefined`. */
  contextPrefix?: string | undefined;
  onTurn?: (response: ChatResponse) => void;
}

export function useRagChat(options: UseRagChatOptions = {}) {
  const { contextPrefix, onTurn } = options;

  const [messages, setMessages] = useState<Message[]>([]);
  const [faq, setFaq] = useState<FaqItem[]>([]);
  const [sending, setSending] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const welcomeRef = useRef(false);

  useEffect(() => {
    if (welcomeRef.current) return;
    welcomeRef.current = true;

    (async () => {
      try {
        const [welcome, faqItems] = await Promise.all([chat(null), getFaq()]);
        setMessages([
          {
            id: welcome.request_id,
            role: 'assistant',
            text: welcome.answer,
            requestId: welcome.request_id,
          },
        ]);
        setFaq(faqItems);
        setRemaining(welcome.remaining_anonymous);
        setInitialized(true);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load assistant',
        );
        setInitialized(true);
      }
    })();
  }, []);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sending) return;

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        text: trimmed,
      };
      setMessages((prev) => [...prev, userMsg]);
      setSending(true);
      setError(null);

      try {
        const fullMessage = contextPrefix
          ? `Regarding ${contextPrefix}: ${trimmed}`
          : trimmed;

        const response = await chat(fullMessage);

        const assistantMsg: Message = {
          id: response.request_id,
          role: 'assistant',
          text: response.answer,
          sourceCards: response.source_cards,
          refused: response.refused,
          requestId: response.request_id,
        };

        setMessages((prev) => [...prev, assistantMsg]);
        setRemaining(response.remaining_anonymous);
        setRequiresAuth(response.requires_auth);
        onTurn?.(response);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            text: 'Sorry — the assistant is having trouble right now. Please try again in a moment.',
            refused: true,
          },
        ]);
        setError(err instanceof Error ? err.message : 'Request failed');
      } finally {
        setSending(false);
      }
    },
    [sending, contextPrefix, onTurn],
  );

  const setFeedback = useCallback(
    (messageId: string, feedback: 'up' | 'down') => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, feedback } : m,
        ),
      );
    },
    [],
  );

  return {
    messages, faq, sending, remaining, requiresAuth, error, initialized,
    send, setFeedback,
  };
}