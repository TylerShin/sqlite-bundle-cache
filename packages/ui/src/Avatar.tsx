import React from 'react';
import { cn } from '@sqlite-bundle/utils';

export interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Avatar({ src, alt, fallback, size = 'md', className }: AvatarProps) {
  const sizeClasses = { sm: 'avatar-sm', md: 'avatar-md', lg: 'avatar-lg' };
  
  return (
    <div className={cn('avatar', sizeClasses[size], className)}>
      {src ? (
        <img src={src} alt={alt || 'Avatar'} className="avatar-image" />
      ) : (
        <span className="avatar-fallback">{fallback || '?'}</span>
      )}
    </div>
  );
}
