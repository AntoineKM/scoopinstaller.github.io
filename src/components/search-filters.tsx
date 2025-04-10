"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { 
  Settings, 
  ArrowDownAZ, 
  ArrowUpZA, 
  SortDesc, 
  CalendarDays,
  CheckCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const sortModes = [
  { name: "Best match", value: 0, icon: SortDesc },
  { name: "Name", value: 1, icon: ArrowDownAZ },
  { name: "Newest", value: 2, icon: CalendarDays },
];

type SearchFiltersProps = {
  sortIndex: number;
  sortDirection: number;
  officialOnly: boolean;
  distinctOnly: boolean;
  showBucketName: boolean;
};

export function SearchFilters({
  sortIndex,
  sortDirection,
  officialOnly,
  distinctOnly,
  showBucketName,
}: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const updateFilter = (
    param: string, 
    value: string | number | boolean
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Reset to page 1 when changing filters
    params.set("p", "1");
    
    if (typeof value === "boolean") {
      params.set(param, value.toString());
    } else {
      params.set(param, value.toString());
    }
    
    // Update the URL with the new parameters
    router.push(`/apps?${params.toString()}`);
    
    // Save preferences to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(param, value.toString());
    }
  };
  
  const toggleSort = (index: number) => {
    if (index === sortIndex) {
      // Toggle direction if same sort
      updateFilter("d", sortDirection === 1 ? 0 : 1);
    } else {
      // Set new sort with default direction
      updateFilter("s", index);
      // Name sort is ascending by default, others are descending
      updateFilter("d", index === 1 ? 0 : 1);
    }
  };
  
  const currentSortMode = sortModes.find(mode => mode.value === sortIndex) || sortModes[0];
  const SortIcon = currentSortMode.icon;
  
  return (
    <div className="flex items-center justify-between">
      <div>
        {searchParams.get("q") && (
          <p className="text-sm text-muted-foreground">
            Showing results for <Badge variant="outline" className="ml-1 font-mono">{searchParams.get("q")}</Badge>
          </p>
        )}
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-2">
            <Settings className="h-3.5 w-3.5" />
            <span className="hidden sm:inline-block">Filters & Sort</span>
            <span className="sr-only sm:not-sr-only">
              {currentSortMode.name}, {officialOnly ? "Official only" : "All buckets"}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Sorting</DropdownMenuLabel>
          {sortModes.map((mode) => (
            <DropdownMenuItem 
              key={mode.value}
              onClick={() => toggleSort(mode.value)}
              className="flex justify-between"
            >
              <span className="flex items-center gap-2">
                <mode.icon className="h-4 w-4" />
                {mode.name}
              </span>
              {sortIndex === mode.value && (
                sortDirection === 1 ? 
                  <ArrowDownAZ className="h-4 w-4" /> : 
                  <ArrowUpZA className="h-4 w-4" />
              )}
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Filtering</DropdownMenuLabel>
          
          <DropdownMenuCheckboxItem 
            checked={officialOnly}
            onCheckedChange={(checked) => updateFilter("o", checked)}
          >
            <span className="flex items-center gap-2">
              Official buckets only
              <CheckCircle className="h-3.5 w-3.5 text-blue-500" />
            </span>
          </DropdownMenuCheckboxItem>
          
          <DropdownMenuCheckboxItem 
            checked={distinctOnly}
            onCheckedChange={(checked) => updateFilter("dm", checked)}
          >
            Distinct manifests only
          </DropdownMenuCheckboxItem>
          
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Options</DropdownMenuLabel>
          
          <DropdownMenuCheckboxItem 
            checked={showBucketName}
            onCheckedChange={(checked) => updateFilter("n", checked)}
          >
            Show bucket name in install command
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}