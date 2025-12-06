import React from 'react';
import { cn } from '@sqlite-bundle/utils';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export function Checkbox({ label, className, id, ...props }: CheckboxProps) {
  const inputId = id || `checkbox-${Math.random().toString(36).slice(2)}`;
  
  return (
    <label htmlFor={inputId} className={cn('checkbox-wrapper', className)}>
      <input type="checkbox" id={inputId} className="checkbox-input" {...props} />
      <span className="checkbox-box" />
      {label && <span className="checkbox-label">{label}</span>}
    </label>
  );
}
