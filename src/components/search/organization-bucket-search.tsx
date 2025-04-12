"use client";

import { useRouter } from "next/navigation";
import { SearchInput } from "@/components/search/search-input";

// OrganizationSearch Component
export interface OrganizationSearchProps {
  initialQuery: string;
  provider: string;
}

export function OrganizationSearch({ initialQuery = "", provider }: OrganizationSearchProps) {
  const router = useRouter();
  
  const handleSearch = (query: string) => {
    const params = new URLSearchParams();
    
    if (query) {
      params.set("q", query);
    }
    
    // Reset page on new search
    params.delete("page");
    
    router.push(`/apps/${provider}${params.toString() ? `?${params.toString()}` : ""}`);
  };
  
  return (
    <SearchInput
      initialQuery={initialQuery}
      placeholder={`Search organizations...`}
      className="w-full max-w-md"
      inputHeight="h-12"
      buttonText="Search"
      onSearch={handleSearch}
    />
  );
}

// BucketSearchInOrg Component
export interface BucketSearchInOrgProps {
  initialQuery: string;
  provider: string;
  organization: string;
}

export function BucketSearchInOrg({ 
  initialQuery = "", 
  provider, 
  organization 
}: BucketSearchInOrgProps) {
  const router = useRouter();
  
  const handleSearch = (query: string) => {
    const params = new URLSearchParams();
    
    if (query) {
      params.set("q", query);
    }
    
    router.push(`/apps/${provider}/${organization}${params.toString() ? `?${params.toString()}` : ""}`);
  };
  
  return (
    <SearchInput
      initialQuery={initialQuery}
      placeholder={`Search buckets...`}
      className="w-full max-w-md"
      inputHeight="h-12" 
      buttonText="Search"
      onSearch={handleSearch}
    />
  );
}

// AppSearchInBucket Component
export interface AppSearchInBucketProps {
  initialQuery: string;
  provider: string;
  organization: string;
  bucket: string;
}

export function AppSearchInBucket({ 
  initialQuery = "", 
  provider, 
  organization, 
  bucket 
}: AppSearchInBucketProps) {
  const router = useRouter();
  
  const handleSearch = (query: string) => {
    const params = new URLSearchParams();
    
    if (query) {
      params.set("q", query);
    }
    
    // Reset to page 1 when searching
    params.set("p", "1");
    
    router.push(`/apps/${provider}/${organization}/${bucket}${params.toString() ? `?${params.toString()}` : ""}`);
  };
  
  return (
    <SearchInput
      initialQuery={initialQuery}
      placeholder={`Search in ${bucket}...`}
      className="w-full max-w-md"
      inputHeight="h-12"
      buttonText="Search"
      onSearch={handleSearch}
    />
  );
}