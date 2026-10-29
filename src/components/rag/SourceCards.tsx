// src/components/rag/SourceCards.tsx
import React from 'react';
import { SourceCard } from '../../api/ragClient';

interface Props {
  cards: SourceCard[];
}

export function SourceCards({ cards }: Props) {
  if (!cards.length) return null;

  return (
    <div className="flex flex-col gap-1.5 mt-2">
      {cards.map((card, i) => (
        <a
          key={`${card.kind}-${card.product_id ?? card.canonical_id ?? i}`}
          href={card.url ?? '#'}
          target={card.url ? '_blank' : undefined}
          rel="noopener noreferrer"
          className="flex items-center gap-2 p-1.5 rounded-lg bg-white border border-gray-200 hover:border-blue-400 transition-colors text-xs"
        >
          {card.main_image && (
            <img
              src={card.main_image}
              alt={card.name}
              className="w-10 h-10 object-cover rounded"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 truncate">{card.name}</div>
            <div className="text-gray-500 truncate">
              {card.price != null && `${card.price.toFixed(2)} DT`}
              {card.site && ` · ${card.site}`}
              {card.availability && ` · ${card.availability}`}
              {card.cheapest_site && ` · cheapest at ${card.cheapest_site}`}
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}