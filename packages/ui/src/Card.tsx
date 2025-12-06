import React from 'react';
import { cn } from '@sqlite-bundle/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
}

export function Card({ title, description, children, className, ...props }: CardProps) {
  return (
    <div className={cn('card', className)} {...props}>
      {title && <h3 className="card-title">{title}</h3>}
      {description && <p className="card-description">{description}</p>}
      <div className="card-content">{children}</div>
    </div>
  );
}
