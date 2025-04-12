"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface SearchInputProps {
  /** Initial search query */
  initialQuery?: string;
  /** Placeholder text for the search input */
  placeholder?: string;
  /** Optional class name for the container */
  className?: string;
  /** Optional class name for the input */
  inputClassName?: string;
  /** Optional class name for the button */
  buttonClassName?: string;
  /** Optional text for the search button */
  buttonText?: string;
  /** Whether to automatically submit the search after a delay */
  autoSearch?: boolean;
  /** Delay in ms before auto-searching (default: 500) */
  debounceTime?: number;
  /** Optional icon for the search button */
  icon?: React.ReactNode;
  /** Optional height for the input */
  inputHeight?: string;
  /** Optional font size for the input */
  textSize?: string;
  /** Focus the input on mount */
  autoFocus?: boolean;
  /** Callback when search is submitted */
  onSearch: (query: string) => void;
}

export function SearchInput({
  initialQuery = "",
  placeholder = "Search...",
  className = "",
  inputClassName = "",
  buttonClassName = "",
  buttonText = "Search",
  autoSearch = false,
  debounceTime = 500,
  icon = null, // Default to no icon
  inputHeight = "h-12",
  textSize = "text-base",
  autoFocus = false,
  onSearch,
}: SearchInputProps) {
  const [query, setQuery] = useState(initialQuery);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Update query when initialQuery changes (e.g. for back navigation)
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  // Handle form submission
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearch(query.trim());
  };

  // Handle auto-search with debounce
  useEffect(() => {
    if (!autoSearch) return;

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    if (query.trim() !== initialQuery) {
      debounceTimeout.current = setTimeout(() => {
        onSearch(query.trim());
      }, debounceTime);
    }

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [query, autoSearch, debounceTime, onSearch, initialQuery]);

  // Focus input on mount if autoFocus is true
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <form 
      onSubmit={handleSubmit}
      className={cn("relative w-full", className)}
    >
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          <Search className="h-4 w-4" />
        </div>
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "pl-10",
            buttonText ? "pr-20" : "pr-4",
            inputHeight,
            textSize,
            inputClassName
          )}
        />
        <Button 
          type="submit" 
          size="sm" 
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2",
            buttonClassName
          )}
        >
          {buttonText}
        </Button>
      </div>
    </form>
  );
}