"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, AlertCircle, Star, ArrowUpDown, Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import { API_CONFIG } from '@/lib/api-config';

type Bucket = {
  bucket: string;
  manifests: number;
  official: boolean;
  stars?: number;
  category?: string;
};

type FacetItem = {
  value: string;
  count: number;
};

const sortModes = ["Default", "Name", "Manifests"];
const bucketCategories = ["All", "Official", "Community"];

const perPageOptions = [15, 30, 50, 100];

export default function BucketsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const pageFromUrl = parseInt(searchParams.get("page") || "1", 10);
  const sortModeFromUrl = searchParams.get("sort") || "Default";
  const categoryFromUrl = searchParams.get("category") || "All";
  const queryFromUrl = searchParams.get("q") || "";
  const perPageFromUrl = parseInt(searchParams.get("per_page") || "15", 10);
  
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [filteredBuckets, setFilteredBuckets] = useState<Bucket[]>([]);
  const [displayedBuckets, setDisplayedBuckets] = useState<Bucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortMode, setSortMode] = useState(sortModeFromUrl);
  const [searchQuery, setSearchQuery] = useState(queryFromUrl);
  const [activeCategory, setActiveCategory] = useState(categoryFromUrl);
  const [currentPage, setCurrentPage] = useState(pageFromUrl);
  const [itemsPerPage, setItemsPerPage] = useState(
    perPageOptions.includes(perPageFromUrl) ? perPageFromUrl : perPageOptions[0]
  );
  const [totalPages, setTotalPages] = useState(1);
  
  const getFullBucketName = (bucketUrl: string): string => {
    const parts = bucketUrl.split('/');
    if (parts.length >= 2) {
      return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
    }
    return parts[parts.length - 1] || '';
  };
  
  // Sort buckets based on mode
  const sortBuckets = useCallback((bucketsToSort: Bucket[], mode: string): Bucket[] => {
    const bucketsCopy = [...bucketsToSort];
    
    switch (mode) {
      case "Default":
        return bucketsCopy.sort((a, b) => {
          // First by official status
          if (a.official !== b.official) {
            return a.official ? -1 : 1;
          }
          // Then by bucket name
          return getFullBucketName(a.bucket).localeCompare(getFullBucketName(b.bucket));
        });
      
      case "Name":
        return bucketsCopy.sort((a, b) => 
          getFullBucketName(a.bucket).localeCompare(getFullBucketName(b.bucket))
        );
      
      case "Manifests":
        return bucketsCopy.sort((a, b) => b.manifests - a.manifests);
      
      default:
        return bucketsCopy;
    }
  }, []);
  
  // Fetch buckets data
  useEffect(() => {
    const fetchBuckets = async () => {
      setLoading(true);
      
      try {
        // We need to fetch both official and community buckets
        const fetchBucketsByType = async (isOfficial: boolean) => {
          const response = await fetch(API_CONFIG.getSearchUrl(), {
            method: 'POST',
            headers: API_CONFIG.getSearchHeaders(),
            body: JSON.stringify({
              count: true,
              facets: ['Metadata/Repository,count:10000'],
              filter: `Metadata/OfficialRepositoryNumber eq ${isOfficial ? '1' : '0'}`,
              top: 0, // Don't retrieve actual data, just facets
            }),
          });
          
          if (!response.ok) {
            throw new Error(`Buckets request failed: ${response.status} ${response.statusText}`);
          }
          
          const data = await response.json();
          
          // Different ways the API might return facets
          let facets: FacetItem[] = [];
          
          // Case 1: Standard expected format
          if (data.facets && data.facets['Metadata/Repository']) {
            facets = data.facets['Metadata/Repository'];
          } 
          // Case 2: '@search.facets' format (from docs)
          else if (data['@search.facets'] && data['@search.facets']['Metadata/Repository']) {
            facets = data['@search.facets']['Metadata/Repository'];
          }
          // Case 3: Results directly in the data
          else if (Array.isArray(data.value) && data.value.length > 0) {
            // Create facets by grouping by repository
            const repoMap: Record<string, number> = {};
            data.value.forEach((item: any) => {
              const repo = item.Metadata?.Repository;
              if (repo) {
                if (!repoMap[repo]) {
                  repoMap[repo] = 0;
                }
                repoMap[repo]++;
              }
            });
            
            facets = Object.entries(repoMap).map(([value, count]) => ({
              value,
              count
            }));
          } else {
            console.error('Unexpected API response structure:', data);
            return [];
          }
          
          return facets.map((item: FacetItem) => ({
            bucket: item.value,
            manifests: item.count,
            official: isOfficial,
            stars: isOfficial ? undefined : 0, // We don't have stars info here
          }));
        };
        
        // Fetch both bucket types
        const officialBuckets = await fetchBucketsByType(true);
        const communityBuckets = await fetchBucketsByType(false);
        
        // Combine and sort buckets
        const allBuckets = [...officialBuckets, ...communityBuckets];
        
        // Categorize buckets
        const categorizedBuckets = allBuckets.map(bucket => {
          let category = 'Community';
          if (bucket.official) {
            category = 'Official';
          }
          return { ...bucket, category };
        });
        
        const sortedBuckets = sortBuckets(categorizedBuckets, sortMode);
        setBuckets(sortedBuckets);
        setFilteredBuckets(sortedBuckets);
      } catch (error) {
        console.error("Error fetching buckets:", error);
        setBuckets([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBuckets();
  }, [sortMode, sortBuckets]);
  
  // Update URL parameters when state changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (currentPage !== 1) {
      params.set("page", currentPage.toString());
    } else {
      params.delete("page");
    }
    
    if (sortMode !== "Default") {
      params.set("sort", sortMode);
    } else {
      params.delete("sort");
    }
    
    if (activeCategory !== "All") {
      params.set("category", activeCategory);
    } else {
      params.delete("category");
    }
    
    if (searchQuery) {
      params.set("q", searchQuery);
    } else {
      params.delete("q");
    }
    
    if (itemsPerPage !== perPageOptions[0]) {
      params.set("per_page", itemsPerPage.toString());
    } else {
      params.delete("per_page");
    }
    
    // Update URL without reloading page
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
    router.push(newUrl, { scroll: false });
    
  }, [currentPage, sortMode, activeCategory, searchQuery, itemsPerPage, router, searchParams]);
  
  // Filter buckets based on search query and category
  useEffect(() => {
    const filterBuckets = () => {
      if (!searchQuery.trim() && activeCategory === 'All') {
        setFilteredBuckets(buckets);
      } else {
        let filtered = buckets;
        
        // Filter by category if not "All"
        if (activeCategory !== 'All') {
          filtered = filtered.filter(bucket => bucket.category === activeCategory);
        }
        
        // Filter by search query if present
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(bucket => 
            getFullBucketName(bucket.bucket).toLowerCase().includes(query)
          );
        }
        
        setFilteredBuckets(filtered);
      }
      
      // Reset to first page when filters change
      setCurrentPage(1);
    };
    
    filterBuckets();
  }, [searchQuery, buckets, activeCategory]);
  
  // Update displayed buckets based on pagination
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setDisplayedBuckets(filteredBuckets.slice(startIndex, endIndex));
    
    // Calculate total pages
    setTotalPages(Math.max(1, Math.ceil(filteredBuckets.length / itemsPerPage)));
  }, [filteredBuckets, currentPage, itemsPerPage]);
  
  // Event handlers
  const handleSortChange = (value: string) => {
    setSortMode(value);
    setCurrentPage(1); // Reset to first page on sort change
  };
  
  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setCurrentPage(1); // Reset to first page on category change
  };
  
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value, 10));
    setCurrentPage(1); // Reset to first page when changing items per page
  };
  
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };
  
  return (
    <div className="container mx-auto px-4 py-8 md:px-6">
      <div className="flex flex-col gap-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Scoop Buckets</h1>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Items per page:</span>
              <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
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
        </div>
        
        <div className="flex flex-col md:flex-row items-start gap-4">
          <div className="relative w-full md:w-2/3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search buckets..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
            />
          </div>
          
          <Tabs 
            defaultValue="All"
            className="w-full md:w-1/3"
            value={activeCategory} 
            onValueChange={handleCategoryChange}
          >
            <TabsList className="grid grid-cols-3 w-full">
              {bucketCategories.map(category => (
                <TabsTrigger key={category} value={category} className="cursor-pointer">
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[240px]">
                  <div className="flex items-center gap-2">
                    Bucket <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="text-right">Manifests</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedBuckets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="h-24 text-center">
                    No buckets found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : displayedBuckets.map((bucket) => (
                <TableRow key={bucket.bucket}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/apps?q="${encodeURIComponent(bucket.bucket)}"${bucket.official ? '' : '&o=false'}`}
                        className="hover:underline text-primary"
                      >
                        {getFullBucketName(bucket.bucket)}
                      </Link>
                      {bucket.official ? (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          <span className="text-xs">Official</span>
                        </Badge>
                      ) : bucket.stars && bucket.stars > 50 ? (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800 flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          <span className="text-xs">{bucket.stars}</span>
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-300 border-slate-200 dark:border-slate-800 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          <span className="text-xs">Community</span>
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {bucket.manifests}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <div className="py-4 flex flex-col md:flex-row justify-between items-center px-4 text-sm text-muted-foreground">
            <div>
              Showing {displayedBuckets.length} of {filteredBuckets.length} buckets
            </div>
            <div className="mt-2 md:mt-0">
              Page {currentPage} of {totalPages}
            </div>
          </div>
          
          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 my-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="cursor-pointer"
              >
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Show pages around current page
                  let pageToShow;
                  if (totalPages <= 5) {
                    // If 5 or fewer pages, show all pages
                    pageToShow = i + 1;
                  } else if (currentPage <= 3) {
                    // For early pages
                    pageToShow = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    // For late pages
                    pageToShow = totalPages - 4 + i;
                  } else {
                    // For middle pages
                    pageToShow = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageToShow}
                      variant={currentPage === pageToShow ? "default" : "outline"}
                      size="sm"
                      onClick={() => goToPage(pageToShow)}
                      className="w-8 h-8 p-0 cursor-pointer"
                    >
                      {pageToShow}
                    </Button>
                  );
                })}
                
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <span className="mx-1">...</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(totalPages)}
                      className="w-8 h-8 p-0 cursor-pointer"
                    >
                      {totalPages}
                    </Button>
                  </>
                )}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="cursor-pointer"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}