import React from 'react';
import { useLanguage } from '../context/useLanguage';
import './Pagination.css';

const Pagination = ({ currentPage, pageSize, totalItems, onPageChange }) => {
  const { t } = useLanguage();
  const totalPages = Math.ceil(totalItems / pageSize);

  if (totalPages <= 1) return null;

  const safeCurrentPage = Math.max(1, Math.min(currentPage, totalPages));
  const firstVisiblePage = Math.max(1, Math.min(safeCurrentPage - 2, totalPages - 4));
  const visiblePages = Array.from(
    { length: Math.min(totalPages, 5) },
    (_, index) => firstVisiblePage + index
  );
  const firstItem = (safeCurrentPage - 1) * pageSize + 1;
  const lastItem = Math.min(safeCurrentPage * pageSize, totalItems);

  return (
    <nav className="shared-pagination" aria-label={t('Pagination')}>
      <span className="shared-pagination-summary">
        {t('Showing')} {firstItem}–{lastItem} {t('of')} {totalItems}
      </span>
      <div className="shared-pagination-controls">
        <button
          type="button"
          onClick={() => onPageChange(safeCurrentPage - 1)}
          disabled={safeCurrentPage === 1}
        >
          {t('Previous')}
        </button>
        {visiblePages.map((page) => (
          <button
            type="button"
            key={page}
            className={page === safeCurrentPage ? 'active' : ''}
            aria-current={page === safeCurrentPage ? 'page' : undefined}
            aria-label={`${t('Page')} ${page}`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPageChange(safeCurrentPage + 1)}
          disabled={safeCurrentPage === totalPages}
        >
          {t('Next')}
        </button>
      </div>
    </nav>
  );
};

export default Pagination;
