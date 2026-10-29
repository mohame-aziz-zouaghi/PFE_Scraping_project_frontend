// src/components/rag/FaqChips.tsx
import React from 'react';
import { FaqItem } from '../../api/ragClient';

interface Props {
  items: FaqItem[];
  onSelect: (question: string) => void;
  disabled?: boolean;
}

export function FaqChips({ items, onSelect, disabled }: Props) {
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {items.map((item) => (
        <button
          key={item.slug}
          onClick={() => onSelect(item.title)}
          disabled={disabled}
          className="text-xs px-2.5 py-1 rounded-full bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {item.title}
        </button>
      ))}
    </div>
  );
}