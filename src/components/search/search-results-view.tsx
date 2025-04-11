"use client";

import { SortDesc } from "lucide-react";
import { SearchResults } from "@/components/search-results";
import { Pagination } from "@/components/pagination";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowDownAZ, CalendarDays } from "lucide-react";
import { sortModes } from "@/app/apps/page";

type SearchResultsViewProps = {
  loading: boolean;
  totalCount: number;
  query: string;
  sortIndex: number;
  sortModes: any[];
  toggleSort: (index: number) => void;
  results: any[];
  officialOnly: boolean;
  showBucketName: boolean;
  RESULTS_PER_PAGE: number;
  page: number;
};

export function SearchResultsView({
  loading,
  totalCount,
  query,
  sortIndex,
  sortModes,
  toggleSort,
  results,
  officialOnly,
  showBucketName,
  RESULTS_PER_PAGE,
  page
}: SearchResultsViewProps) {
  // Import icon components dynamically
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'sort-desc':
        return SortDesc;
      case 'arrow-down-a-z':
        return ArrowDownAZ;
      case 'calendar-days':
        return CalendarDays;
      default:
        return SortDesc;
    }
  };

  return (
    <>
      {/* Results info bar */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-muted-foreground">Searching...</span>
            </div>
          ) : (
            <p className="text-sm">
              {totalCount > 0 ? (
                <>Found <span className="font-medium">{totalCount}</span> results{query ? ` for "${query}"` : ""}</>
              ) : (
                <>No results found{query ? ` for "${query}"` : ""}</>
              )}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground mr-1 hidden sm:inline">Sort by:</span>
          <Tabs 
            value={sortIndex.toString()}
            onValueChange={(value) => toggleSort(parseInt(value, 10))}
            className="w-full sm:w-auto"
          >
            <TabsList className="grid grid-cols-3 h-8">
              {sortModes.map((mode) => {
                const IconComponent = getIconComponent(mode.icon);
                return (
                  <TabsTrigger 
                    key={mode.id} 
                    value={mode.id.toString()}
                    className="text-xs px-2.5"
                  >
                    <IconComponent className="h-3.5 w-3.5 mr-1.5" />
                    {mode.name}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      {/* Search results */}
      <div className="mb-8">
        <SearchResults
          results={results}
          loading={loading}
          query={query}
          officialOnly={officialOnly}
          showBucketName={showBucketName}
          totalCount={totalCount}
        />
      </div>
      
      {/* Pagination */}
      {totalCount > RESULTS_PER_PAGE && (
        <div className="flex justify-center">
          <Pagination
            currentPage={page}
            totalPages={Math.ceil(totalCount / RESULTS_PER_PAGE)}
          />
        </div>
      )}
    </>
  );
}