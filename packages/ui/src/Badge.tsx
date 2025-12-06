import React from 'react';
import { cn } from '@sqlite-bundle/utils';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({ children, variant = 'default', size = 'md', className }: BadgeProps) {
  return (
    <span className={cn('badge', `badge-${variant}`, `badge-${size}`, className)}>
      {children}
    </span>
  );
}
