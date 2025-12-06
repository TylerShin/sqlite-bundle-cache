import React from 'react';
import { cn } from '@sqlite-bundle/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).slice(2)}`;
  
  return (
    <div className="input-wrapper">
      {label && <label htmlFor={inputId} className="input-label">{label}</label>}
      <input
        id={inputId}
        className={cn('input', error && 'input-error', className)}
        {...props}
      />
      {error && <span className="input-error-text">{error}</span>}
    </div>
  );
}
