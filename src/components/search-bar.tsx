"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type SearchBarProps = {
  initialQuery?: string;
};

export function SearchBar({ initialQuery = "" }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Update query when initialQuery changes (for back navigation)
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
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
  
  // Delay search while typing
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Setup debounced query for auto-search
  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    debounceTimeout.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500); // 500ms delay
    
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [query]);
  
  // Auto-submit search when debounced query changes
  useEffect(() => {
    if (debouncedQuery === initialQuery || !debouncedQuery.trim()) return;
    
    const params = new URLSearchParams(searchParams.toString());
    params.set("q", debouncedQuery.trim());
    params.set("p", "1");
    router.push(`/apps?${params.toString()}`);
  }, [debouncedQuery, initialQuery, router, searchParams]);
  
  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <form 
      onSubmit={handleSearch}
      className="relative w-full"
    >
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search an app"
          className="pl-10 pr-12 h-12 text-base"
        />
        <Button 
          type="submit" 
          size="sm" 
          className="absolute right-1 top-1/2 -translate-y-1/2 h-10"
        >
          Search
        </Button>
      </div>
    </form>
  );
}