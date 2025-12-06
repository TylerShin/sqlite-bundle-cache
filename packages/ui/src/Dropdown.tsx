import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@sqlite-bundle/utils';

export interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export function Dropdown({ trigger, children, align = 'left', className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className={cn('dropdown', className)}>
      <div onClick={() => setOpen(!open)} className="dropdown-trigger">
        {trigger}
      </div>
      {open && (
        <div className={cn('dropdown-content', `dropdown-${align}`)}>
          {children}
        </div>
      )}
    </div>
  );
}

export interface DropdownItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

export function DropdownItem({ children, onClick, disabled }: DropdownItemProps) {
  return (
    <button
      className={cn('dropdown-item', disabled && 'dropdown-item-disabled')}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
