import { useState, useMemo, useCallback } from "react";
import { DEFAULT_PAGE, DEFAULT_LIMIT } from "@/constants/pagination";

export interface UsePaginationOptions {
  initialPage?: number;
  initialLimit?: number;
  totalItems?: number;
}

export const usePagination = ({
  initialPage = DEFAULT_PAGE,
  initialLimit = DEFAULT_LIMIT,
  totalItems = 0,
}: UsePaginationOptions = {}) => {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalItems / limit));
  }, [totalItems, limit]);

  const nextPage = useCallback(() => {
    setPage((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const goToPage = useCallback((newPage: number) => {
    setPage(Math.max(1, Math.min(newPage, totalPages)));
  }, [totalPages]);

  return {
    page,
    limit,
    totalPages,
    totalItems,
    setPage: goToPage,
    setLimit,
    nextPage,
    prevPage,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

export default usePagination;
