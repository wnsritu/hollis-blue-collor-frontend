// components/ui/PaginationController.tsx
import React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";

interface PaginationControllerProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
  limit?: number; // Alias for pageSize
  onPageSizeChange?: (pageSize: number) => void;
  onLimitChange?: (limit: number) => void; // Alias for onPageSizeChange
  pageSizeOptions?: number[];
  className?: string;
  loading?: boolean;
  isLoading?: boolean; // Alias for loading
}

export const PaginationController: React.FC<PaginationControllerProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  limit,
  onPageSizeChange,
  onLimitChange,
  pageSizeOptions = [10, 20, 50, 100],
  className = "",
  loading = false,
  isLoading = false,
}) => {
  const effectivePageSize = pageSize ?? limit;
  const effectiveOnPageSizeChange = onPageSizeChange ?? onLimitChange;
  const effectiveLoading = loading || isLoading;

  if (totalPages <= 0 && !totalItems) return null;

  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);

  // Generate an array of page numbers with ellipsis for large pages
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    if (safeTotalPages <= 7) {
      for (let i = 1; i <= safeTotalPages; i++) pages.push(i);
    } else {
      if (safeCurrentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, "ellipsis", safeTotalPages);
      } else if (safeCurrentPage >= safeTotalPages - 3) {
        pages.push(
          1,
          "ellipsis",
          safeTotalPages - 4,
          safeTotalPages - 3,
          safeTotalPages - 2,
          safeTotalPages - 1,
          safeTotalPages,
        );
      } else {
        pages.push(
          1,
          "ellipsis",
          safeCurrentPage - 1,
          safeCurrentPage,
          safeCurrentPage + 1,
          "ellipsis",
          safeTotalPages,
        );
      }
    }
    return pages;
  };

  const pages = getPageNumbers();

  const startItem = totalItems !== undefined && effectivePageSize !== undefined
    ? Math.min(totalItems, (safeCurrentPage - 1) * effectivePageSize + 1)
    : undefined;
  const endItem = totalItems !== undefined && effectivePageSize !== undefined
    ? Math.min(totalItems, safeCurrentPage * effectivePageSize)
    : undefined;

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 text-sm text-muted-foreground ${className}`}>
      {totalItems !== undefined && startItem !== undefined && endItem !== undefined ? (
        <div className="text-xs font-medium">
          Showing <span className="font-semibold text-foreground">{startItem}</span> to{" "}
          <span className="font-semibold text-foreground">{endItem}</span> of{" "}
          <span className="font-semibold text-foreground">{totalItems}</span> entries
        </div>
      ) : (
        <div className="text-xs font-medium">
          Page <span className="font-semibold text-foreground">{safeCurrentPage}</span> of{" "}
          <span className="font-semibold text-foreground">{safeTotalPages}</span>
        </div>
      )}

      <div className="flex items-center gap-3">
        {effectiveOnPageSizeChange && effectivePageSize !== undefined && (
          <div className="flex items-center gap-1.5 text-xs">
            <span>Per page:</span>
            <select
              value={effectivePageSize}
              onChange={(e) => effectiveOnPageSizeChange(Number(e.target.value))}
              className="h-8 rounded-md border border-input bg-background px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              disabled={effectiveLoading}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}

        <Pagination className="w-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => !effectiveLoading && safeCurrentPage > 1 && onPageChange(safeCurrentPage - 1)}
                className={`cursor-pointer ${safeCurrentPage === 1 || effectiveLoading ? "pointer-events-none opacity-50" : ""
                  }`}
              />
            </PaginationItem>

            {pages.map((p, idx) =>
              p === "ellipsis" ? (
                <PaginationItem key={`ellipsis-${idx}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={p}>
                  <PaginationLink
                    isActive={p === safeCurrentPage}
                    onClick={() => !effectiveLoading && onPageChange(p as number)}
                    className="cursor-pointer"
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}

            <PaginationItem>
              <PaginationNext
                onClick={() => !effectiveLoading && safeCurrentPage < safeTotalPages && onPageChange(safeCurrentPage + 1)}
                className={`cursor-pointer ${safeCurrentPage === safeTotalPages || effectiveLoading ? "pointer-events-none opacity-50" : ""
                  }`}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
};

export default PaginationController;
