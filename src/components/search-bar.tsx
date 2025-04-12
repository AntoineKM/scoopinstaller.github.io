"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { SearchInput } from "@/components/search/search-input";

type SearchBarProps = {
  initialQuery?: string;
};

export function SearchBar({ initialQuery = "" }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const handleSearch = (query: string) => {
    if (!query.trim()) return;
    
    // Create a new URLSearchParams object from the current URL
    const params = new URLSearchParams(searchParams.toString());
    
    // Update the query parameter
    params.set("q", query.trim());
    
    // Reset to page 1 when changing the query
    params.set("p", "1");
    
    // Navigate to the search page with the updated parameters
    router.push(`/apps?${params.toString()}`);
  };

  return (
    <SearchInput
      initialQuery={initialQuery}
      placeholder="Search an app"
      autoSearch={true}
      autoFocus={true}
      onSearch={handleSearch}
      buttonText="Search"
      inputHeight="h-12"
      textSize="text-base"
    />
  );
}