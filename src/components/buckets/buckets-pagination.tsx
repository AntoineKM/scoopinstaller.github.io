import Link from "next/link";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

type BucketsPaginationProps = {
  currentPage: number;
  totalPages: number;
  query: string;
  sortMode: string;
  category: string;
  perPage: number;
};

export function BucketsPagination({ 
  currentPage, 
  totalPages,
  query,
  sortMode,
  category,
  perPage
}: BucketsPaginationProps) {
  
  // Create query parameters for pagination links
  const createPageURL = (pageNumber: number) => {
    const params = new URLSearchParams();
    
    // Only add parameters that are not default values
    if (pageNumber !== 1) {
      params.set("page", pageNumber.toString());
    }
    
    if (query) {
      params.set("q", query);
    }
    
    if (sortMode !== "Default") {
      params.set("sort", sortMode);
    }
    
    if (category !== "All") {
      params.set("category", category);
    }
    
    if (perPage !== 15) {
      params.set("per_page", perPage.toString());
    }
    
    return `/buckets${params.toString() ? `?${params.toString()}` : ""}`;
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
        asChild
        disabled={currentPage <= 1}
      >
        <Link href={createPageURL(Math.max(1, currentPage - 1))} scroll={false}>
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous page</span>
        </Link>
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
              asChild={!current}
              aria-current={current ? "page" : undefined}
              className={current ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}
            >
              {current ? (
                <span>{page}</span>
              ) : (
                <Link href={createPageURL(page as number)} scroll={false}>
                  {page}
                </Link>
              )}
            </Button>
          )}
        </div>
      ))}
      
      <Button
        variant="outline"
        size="icon"
        asChild
        disabled={currentPage >= totalPages}
      >
        <Link href={createPageURL(Math.min(totalPages, currentPage + 1))}  scroll={false}>
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next page</span>
        </Link>
      </Button>
    </div>
  );
}