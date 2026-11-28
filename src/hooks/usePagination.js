import { useState } from 'react';

const DEFAULT_PAGE_SIZE = 10;

const usePagination = (items = [], pageSize = DEFAULT_PAGE_SIZE, resetKey) => {
  const [paginationState, setPaginationState] = useState(() => ({ page: 1, resetKey }));
  const safeItems = Array.isArray(items) ? items : [];
  const totalItems = safeItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const requestedPage = Object.is(paginationState.resetKey, resetKey)
    ? paginationState.page
    : 1;
  const page = Math.max(1, Math.min(requestedPage, totalPages));
  const currentPage = Math.min(page, totalPages);

  const startIndex = (currentPage - 1) * pageSize;
  const setPage = (nextPage) => {
    const newPage = typeof nextPage === 'function' ? nextPage(currentPage) : nextPage;
    setPaginationState({
      page: Math.max(1, Math.min(newPage, totalPages)),
      resetKey
    });
  };

  return {
    currentPage,
    pageSize,
    pageItems: safeItems.slice(startIndex, startIndex + pageSize),
    totalItems,
    totalPages,
    setPage
  };
};

export default usePagination;
