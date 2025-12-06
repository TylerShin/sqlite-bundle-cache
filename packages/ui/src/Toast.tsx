import React, { useEffect, useState } from 'react';
import { cn } from '@sqlite-bundle/utils';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose?: () => void;
}

export function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!visible) return null;

  return (
    <div className={cn('toast', `toast-${type}`)}>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={() => { setVisible(false); onClose?.(); }}>×</button>
    </div>
  );
}

// Toast container for stacking multiple toasts
export function ToastContainer({ children }: { children: React.ReactNode }) {
  return <div className="toast-container">{children}</div>;
}
