"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { SearchInput } from "@/components/search/search-input";

type BucketSearchProps = {
  initialQuery: string;
  sortMode: string;
  category: string;
  perPage: number;
}

export function BucketSearch({
  initialQuery = "",
  sortMode = "Default",
  category = "All",
  perPage = 15
}: BucketSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const handleSearch = (query: string) => {
    const params = new URLSearchParams();
    
    // Only add parameters that are not default values
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
    
    // Always reset to page 1 when searching
    params.delete("page");
    
    // Navigate to new URL
    router.push(`/buckets${params.toString() ? `?${params.toString()}` : ""}`);
  };
  
  return (
    <div className="max-w-3xl mx-auto">
      <SearchInput
        initialQuery={initialQuery}
        placeholder="Search for buckets (e.g., games, nerd-fonts, java...)"
        className="w-full"
        inputHeight="h-12"
        textSize="text-base"
        buttonText="Search"
        onSearch={handleSearch}
      />
    </div>
  );
}