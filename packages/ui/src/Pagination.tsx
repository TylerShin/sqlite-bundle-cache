import React from 'react';
import { cn } from '@sqlite-bundle/utils';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  
  const visiblePages = pages.filter((page) => {
    if (page === 1 || page === totalPages) return true;
    if (Math.abs(page - currentPage) <= 2) return true;
    return false;
  });

  return (
    <nav className={cn('pagination', className)}>
      <button
        className="pagination-btn"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        ←
      </button>
      
      {visiblePages.map((page, index) => {
        const prevPage = visiblePages[index - 1];
        const showEllipsis = prevPage && page - prevPage > 1;
        
        return (
          <React.Fragment key={page}>
            {showEllipsis && <span className="pagination-ellipsis">...</span>}
            <button
              className={cn('pagination-btn', currentPage === page && 'pagination-active')}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          </React.Fragment>
        );
      })}
      
      <button
        className="pagination-btn"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        →
      </button>
    </nav>
  );
}
