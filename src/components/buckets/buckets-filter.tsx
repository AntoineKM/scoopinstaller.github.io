"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type BucketsFilterProps = {
  perPage: number;
  perPageOptions: number[];
  sortMode: string;
  sortModes: string[];
};

export function BucketsFilter({
  perPage,
  perPageOptions,
  sortMode,
  sortModes,
}: BucketsFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Handle per page change
  const handlePerPageChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const numValue = parseInt(value, 10);
    
    if (numValue !== 15) {
      params.set("per_page", value);
    } else {
      params.delete("per_page");
    }
    
    // Reset to page 1
    params.delete("page");
    
    router.push(`/buckets${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false });
  };
  
  // Handle sort change
  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value !== "Default") {
      params.set("sort", value);
    } else {
      params.delete("sort");
    }
    
    // Reset to page 1
    params.delete("page");
    
    router.push(`/buckets${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false });
  };
  
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Items per page:</span>
        <Select value={perPage.toString()} onValueChange={handlePerPageChange}>
          <SelectTrigger className="w-[80px] cursor-pointer">
            <SelectValue placeholder="15" />
          </SelectTrigger>
          <SelectContent>
            {perPageOptions.map((option) => (
              <SelectItem key={option} value={option.toString()}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Sort by:</span>
        <Select value={sortMode} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[140px] cursor-pointer">
            <SelectValue placeholder="Select sort" />
          </SelectTrigger>
          <SelectContent>
            {sortModes.map((mode) => (
              <SelectItem key={mode} value={mode}>
                {mode}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}