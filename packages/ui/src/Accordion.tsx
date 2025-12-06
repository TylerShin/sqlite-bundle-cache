import React, { useState } from 'react';
import { cn } from '@sqlite-bundle/utils';

export interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  className?: string;
}

export function Accordion({ items, allowMultiple = false, className }: AccordionProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (!allowMultiple) next.clear();
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className={cn('accordion', className)}>
      {items.map((item) => (
        <div key={item.id} className="accordion-item">
          <button
            className={cn('accordion-trigger', openItems.has(item.id) && 'accordion-open')}
            onClick={() => toggle(item.id)}
          >
            {item.title}
            <span className="accordion-icon">{openItems.has(item.id) ? '−' : '+'}</span>
          </button>
          {openItems.has(item.id) && (
            <div className="accordion-content">{item.content}</div>
          )}
        </div>
      ))}
    </div>
  );
}
