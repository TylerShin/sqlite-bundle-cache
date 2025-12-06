import React from 'react';
import { cn } from '@sqlite-bundle/utils';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Dialog({ open, onClose, title, description, children, footer, size = 'md' }: DialogProps) {
  if (!open) return null;

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className={cn('dialog', `dialog-${size}`)} onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          {title && <h2 className="dialog-title">{title}</h2>}
          {description && <p className="dialog-description">{description}</p>}
          <button className="dialog-close" onClick={onClose}>×</button>
        </div>
        <div className="dialog-content">{children}</div>
        {footer && <div className="dialog-footer">{footer}</div>}
      </div>
    </div>
  );
}
