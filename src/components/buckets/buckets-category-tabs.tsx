"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

type BucketsCategoryTabsProps = {
  category: string;
  query: string;
  sortMode: string;
  perPage: number;
};

// The categories available for buckets
const bucketCategories = ["All", "Official", "Community"];

export function BucketsCategoryTabs({
  category,
  query,
  sortMode,
  perPage,
}: BucketsCategoryTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Handle category change
  const handleCategoryChange = (newCategory: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (newCategory !== "All") {
      params.set("category", newCategory);
    } else {
      params.delete("category");
    }
    
    // Reset to page 1 when changing category
    params.delete("page");
    
    // Preserve other search parameters
    if (query) {
      params.set("q", query);
    }
    
    if (sortMode !== "Default") {
      params.set("sort", sortMode);
    }
    
    if (perPage !== 15) {
      params.set("per_page", perPage.toString());
    }
    
    router.push(`/buckets${params.toString() ? `?${params.toString()}` : ""}`);
  };
  
  return (
    <Tabs 
      defaultValue="All"
      className="w-full"
      value={category} 
      onValueChange={handleCategoryChange}
    >
      <TabsList className="grid grid-cols-3 w-full">
        {bucketCategories.map(cat => (
          <TabsTrigger key={cat} value={cat} className="cursor-pointer">
            {cat}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}