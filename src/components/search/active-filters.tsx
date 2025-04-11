"use client";

import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ReadonlyURLSearchParams } from "next/navigation";

type ActiveFiltersProps = {
  query: string;
  sortIndex: number;
  sortDirection: number;
  officialOnly: boolean;
  distinctOnly: boolean;
  sortModes: Array<{
    id: number;
    name: string;
    icon: string;
    description: string;
    defaultDirection: number;
  }>;
  updateSearchParams: (key: string, value: any, defaultValue: any) => void;
  router: AppRouterInstance;
  searchParams: ReadonlyURLSearchParams;
};

export function ActiveFilters({
  query,
  sortIndex,
  sortDirection,
  officialOnly,
  distinctOnly,
  sortModes,
  updateSearchParams,
  router,
  searchParams
}: ActiveFiltersProps) {
  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm text-muted-foreground">Active filters:</span>
        
        {query && (
          <Badge variant="secondary" className="gap-1 px-2 py-1">
            Query: {query}
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 ml-1 -mr-1"
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.delete("q");
                params.delete("p");
                router.push(`/apps${params.toString() ? `?${params.toString()}` : ""}`);
              }}
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Remove query filter</span>
            </Button>
          </Badge>
        )}
        
        {sortIndex !== 0 && (
          <Badge variant="secondary" className="gap-1 px-2 py-1">
            Sort: {sortModes[sortIndex].name} ({sortDirection === 1 ? "Desc" : "Asc"})
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 ml-1 -mr-1"
              onClick={() => {
                updateSearchParams("s", 0, 0);
                updateSearchParams("d", 1, 1);
              }}
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Reset sort</span>
            </Button>
          </Badge>
        )}
        
        {!officialOnly && (
          <Badge variant="secondary" className="gap-1 px-2 py-1">
            Including community buckets
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 ml-1 -mr-1"
              onClick={() => updateSearchParams("o", true, true)}
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Show official only</span>
            </Button>
          </Badge>
        )}
        
        {!distinctOnly && (
          <Badge variant="secondary" className="gap-1 px-2 py-1">
            Including duplicates
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 ml-1 -mr-1"
              onClick={() => updateSearchParams("dm", true, true)}
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Show distinct only</span>
            </Button>
          </Badge>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto text-sm h-7"
          onClick={() => {
            router.push("/apps");
          }}
        >
          Clear all filters
        </Button>
      </div>
    </div>
  );
}