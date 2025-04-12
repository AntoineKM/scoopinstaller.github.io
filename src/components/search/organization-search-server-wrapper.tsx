"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SearchInput } from "@/components/search/search-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface OrganizationSearchServerWrapperProps {
  initialQuery: string;
  provider: string;
  page: number;
  perPage: number;
}

export function OrganizationSearchServerWrapper({ 
  initialQuery, 
  provider,
  page,
  perPage 
}: OrganizationSearchServerWrapperProps) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(initialQuery);
  const perPageOptions = [10, 20, 50, 100];
  
  const handleSearch = (query: string) => {
    const params = new URLSearchParams();
    
    if (query) {
      params.set("q", query);
    }
    
    // Reset to page 1 when searching
    if (page !== 1) {
      params.delete("p");
    }
    
    // Keep per_page parameter if it's different from default
    if (perPage !== 20) {
      params.set("per_page", perPage.toString());
    }
    
    router.push(`/apps/${provider}${params.toString() ? `?${params.toString()}` : ""}`);
  };
  
  const handlePerPageChange = (value: string) => {
    const numValue = parseInt(value, 10);
    
    const params = new URLSearchParams();
    
    // Add query parameter if it exists
    if (initialQuery) {
      params.set("q", initialQuery);
    }
    
    // Reset to page 1 when changing items per page
    if (page !== 1) {
      params.delete("p");
    }
    
    // Only add per_page parameter if it's different from default
    if (numValue !== 20) {
      params.set("per_page", value);
    }
    
    router.push(`/apps/${provider}${params.toString() ? `?${params.toString()}` : ""}`);
  };
  
  return (
    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
      <div className="w-full md:flex-1">
        <SearchInput
          initialQuery={initialQuery}
          placeholder={`Search organizations...`}
          className="w-full"
          inputHeight="h-12"
          buttonText="Search"
          onSearch={handleSearch}
        />
      </div>
      
      <div className="flex items-center gap-2 h-12">
        <span className="text-sm text-muted-foreground">Items per page:</span>
        <Select value={perPage.toString()} onValueChange={handlePerPageChange}>
          <SelectTrigger className="w-[80px]">
            <SelectValue placeholder="20" />
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
    </div>
  );
}