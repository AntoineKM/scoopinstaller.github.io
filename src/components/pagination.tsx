"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
};

export function Pagination({ currentPage, totalPages }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set("p", pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };
  
  // Create pagination items with ellipsis
  const generatePaginationItems = () => {
    const items = [];
    const PAGINATION_OFFSET = 2; // Show 2 pages before and after current
    
    // Always show first page
    items.push({
      page: 1,
      current: currentPage === 1,
      ellipsis: false,
    });
    
    let startPage = Math.max(2, currentPage - PAGINATION_OFFSET);
    let endPage = Math.min(totalPages - 1, currentPage + PAGINATION_OFFSET);
    
    // Adjust to show consistent number of pages
    const pagesToShow = PAGINATION_OFFSET * 2 + 1;
    const numVisiblePages = endPage - startPage + 1;
    
    if (numVisiblePages < pagesToShow) {
      // If we're showing fewer pages than we want to show
      if (startPage === 2) {
        // We're at the start, so add more to the end
        endPage = Math.min(totalPages - 1, endPage + (pagesToShow - numVisiblePages));
      } else if (endPage === totalPages - 1) {
        // We're at the end, so add more to the start
        startPage = Math.max(2, startPage - (pagesToShow - numVisiblePages));
      }
    }
    
    // Add ellipsis after first page if needed
    if (startPage > 2) {
      items.push({
        page: "ellipsis-1",
        current: false,
        ellipsis: true,
      });
    }
    
    // Add middle pages
    for (let i = startPage; i <= endPage; i++) {
      items.push({
        page: i,
        current: currentPage === i,
        ellipsis: false,
      });
    }
    
    // Add ellipsis before last page if needed
    if (endPage < totalPages - 1) {
      items.push({
        page: "ellipsis-2",
        current: false,
        ellipsis: true,
      });
    }
    
    // Always show last page (if different from first)
    if (totalPages > 1) {
      items.push({
        page: totalPages,
        current: currentPage === totalPages,
        ellipsis: false,
      });
    }
    
    return items;
  };
  
  const items = generatePaginationItems();
  
  return (
    <div className="flex items-center justify-center space-x-1">
      <Button
        variant="outline"
        size="icon"
        onClick={() => router.push(createPageURL(Math.max(1, currentPage - 1)))}
        disabled={currentPage <= 1}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Previous page</span>
      </Button>
      
      {items.map(({ page, current, ellipsis }) => (
        <div key={page}>
          {ellipsis ? (
            <Button variant="outline" size="icon" disabled>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant={current ? "default" : "outline"}
              size="icon"
              onClick={() => router.push(createPageURL(page))}
              aria-current={current ? "page" : undefined}
            >
              {page}
            </Button>
          )}
        </div>
      ))}
      
      <Button
        variant="outline"
        size="icon"
        onClick={() => router.push(createPageURL(Math.min(totalPages, currentPage + 1)))}
        disabled={currentPage >= totalPages}
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Next page</span>
      </Button>
    </div>
  );
}