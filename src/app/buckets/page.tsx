// Remove "use client" directive as this will be a server component

import { Metadata } from "next";
import Link from "next/link";
import { CheckCircle, AlertCircle, Star, ArrowUpDown, Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BucketsPagination } from "@/components/buckets/buckets-pagination";
import { BucketsFilter } from "@/components/buckets/buckets-filter";
import { BucketsCategoryTabs } from "@/components/buckets/buckets-category-tabs";
import { API_CONFIG } from '@/lib/api-config';

export const metadata: Metadata = {
  title: "Buckets | Scoop",
  description: "Browse all available Scoop buckets.",
};

// Set revalidation time to ensure the page refreshes periodically
export const revalidate = 3600; // Revalidate every hour

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

// Static data for sort modes and bucket categories
const sortModes = ["Default", "Name", "Manifests"];
const bucketCategories = ["All", "Official", "Community"];
const perPageOptions = [15, 30, 50, 100];

// This function fetches data at build time or during revalidation
async function getBuckets() {
  try {
    // Function to fetch buckets by official status
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
        next: { revalidate }
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
        category: isOfficial ? 'Official' : 'Community',
      }));
    };
    
    // Fetch both bucket types
    const officialBuckets = await fetchBucketsByType(true);
    const communityBuckets = await fetchBucketsByType(false);
    
    // Combine all buckets
    const allBuckets = [...officialBuckets, ...communityBuckets];
    
    // Sort by default order (official first, then by name)
    return allBuckets.sort((a, b) => {
      // First by official status
      if (a.official !== b.official) {
        return a.official ? -1 : 1;
      }
      // Then by bucket name
      return getFullBucketName(a.bucket).localeCompare(getFullBucketName(b.bucket));
    });
    
  } catch (error) {
    console.error("Error fetching buckets:", error);
    return [];
  }
}

// Helper function to get the full bucket name from URL
function getFullBucketName(bucketUrl: string): string {
  const parts = bucketUrl.split('/');
  if (parts.length >= 2) {
    return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
  }
  return parts[parts.length - 1] || '';
}

export default async function BucketsPage({
  searchParams,
}: {
  searchParams?: {
    page?: string;
    sort?: string;
    category?: string;
    q?: string;
    per_page?: string;
  };
}) {
  // Get search parameters or use defaults
  const params = await searchParams;
  const page = parseInt(params?.page || "1", 10);
  const sortMode = params?.sort || "Default";
  const category = params?.category || "All";
  const query = params?.q || "";
  const perPage = parseInt(params?.per_page || "15", 10);
  
  // Fetch all buckets - this will run at build time
  const buckets = await getBuckets();
  
  // Filter buckets based on search query and category
  let filteredBuckets = [...buckets];
  
  // Filter by category if not "All"
  if (category !== 'All') {
    filteredBuckets = filteredBuckets.filter(bucket => bucket.category === category);
  }
  
  // Filter by search query if present
  if (query.trim()) {
    const searchQuery = query.toLowerCase();
    filteredBuckets = filteredBuckets.filter(bucket => 
      getFullBucketName(bucket.bucket).toLowerCase().includes(searchQuery)
    );
  }
  
  // Sort buckets based on selected sort mode
  const sortedBuckets = sortBuckets(filteredBuckets, sortMode);
  
  // Calculate pagination
  const totalBuckets = sortedBuckets.length;
  const totalPages = Math.max(1, Math.ceil(totalBuckets / perPage));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  
  // Get the buckets for the current page
  const startIndex = (currentPage - 1) * perPage;
  const endIndex = startIndex + perPage;
  const displayedBuckets = sortedBuckets.slice(startIndex, endIndex);

  return (
    <div className="container mx-auto px-4 py-8 md:px-6">
      <div className="flex flex-col gap-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Scoop Buckets</h1>
          
          <BucketsFilter 
            perPage={perPage}
            perPageOptions={perPageOptions}
            sortMode={sortMode}
            sortModes={sortModes}
          />
        </div>
        
        <div className="flex flex-col md:flex-row items-start gap-4">
          {/* Server-side search form */}
          <form className="relative w-full md:w-2/3" action="/buckets">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              name="q"
              placeholder="Search buckets..."
              className="pl-10 w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              defaultValue={query}
            />
            {/* Hidden inputs to preserve other search params */}
            <input type="hidden" name="page" value="1" />
            {sortMode !== "Default" && <input type="hidden" name="sort" value={sortMode} />}
            {category !== "All" && <input type="hidden" name="category" value={category} />}
            {perPage !== 15 && <input type="hidden" name="per_page" value={perPage.toString()} />}
            <Button type="submit" className="hidden">Search</Button>
          </form>
          
          <div className="w-full md:w-1/3">
            {/* We'll use client-side tabs component */}
            <BucketsCategoryTabs 
              category={category}
              query={query}
              sortMode={sortMode}
              perPage={perPage}
            />
          </div>
        </div>
      </div>
      
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
            Showing {displayedBuckets.length} of {totalBuckets} buckets
          </div>
          <div className="mt-2 md:mt-0">
            Page {currentPage} of {totalPages}
          </div>
        </div>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <BucketsPagination 
            currentPage={currentPage}
            totalPages={totalPages}
            query={query}
            sortMode={sortMode}
            category={category}
            perPage={perPage}
          />
        </div>
      )}
    </div>
  );
}

// Sort buckets based on selected sort mode
function sortBuckets(bucketsToSort: Bucket[], mode: string): Bucket[] {
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
}