import { Metadata } from "next";
import Link from "next/link";
import { CheckCircle, AlertCircle, Star, ArrowUpDown, Search, FolderOpen, Github, PackageOpen, FileCode, Terminal, ChevronRight } from "lucide-react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BucketSearch } from "@/components/buckets/bucket-search";

export const metadata: Metadata = {
  title: "Buckets | Scoop",
  description: "Browse all available Scoop buckets - repositories of package manifests for the Scoop package manager.",
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
const perPageOptions = [15, 30, 50, 100];

// Featured buckets to highlight
const featuredBuckets = [
  {
    name: "main",
    description: "The main bucket for Scoop with essential CLI tools and utilities",
    url: "https://github.com/ScoopInstaller/Main",
    isOfficial: true,
  },
  {
    name: "extras",
    description: "A bucket for GUI applications and other software not included in 'main'",
    url: "https://github.com/ScoopInstaller/Extras",
    isOfficial: true,
  },
  {
    name: "versions",
    description: "Alternative and older versions of applications in the main bucket",
    url: "https://github.com/ScoopInstaller/Versions",
    isOfficial: true,
  },
  {
    name: "games",
    description: "Open source and freeware games and game-related tools",
    url: "https://github.com/Calinou/scoop-games",
    isOfficial: true,
  },
];

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
  
  // Calculate some stats
  const totalBucketsCount = buckets.length;
  const officialBucketsCount = buckets.filter(b => b.official).length;
  const communityBucketsCount = buckets.filter(b => !b.official).length;
  const totalManifestsCount = buckets.reduce((acc, bucket) => acc + bucket.manifests, 0);
  
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

  // Determine if we should show hero and featured section based on whether a search/filter is active
  const isSearchOrFilterActive = query !== "" || category !== "All" || page > 1 || sortMode !== "Default";

  return (
    <div>
      {/* Hero Section when no search/filter is active */}
      {!isSearchOrFilterActive && (
        <section className="bg-gradient-to-b from-primary/5 to-background pt-16 pb-24">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <Badge variant="outline" className="mb-4 px-3 py-1 text-sm inline-flex items-center">
              <FolderOpen className="mr-1 h-3.5 w-3.5" />
              Package Repositories
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-4">
              Scoop Buckets
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Explore and discover all the bucket repositories that power the Scoop package manager ecosystem
            </p>
            
            {/* Quick stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12 max-w-4xl mx-auto">
            <Card className="bg-card/50 p-4 justify-center gap-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-3xl font-bold">{totalBucketsCount}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>Total Buckets</CardDescription>
                </CardContent>
              </Card>
              
              <Card className="bg-card/50 p-4 justify-center gap-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-3xl font-bold">{officialBucketsCount}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>Official Buckets</CardDescription>
                </CardContent>
              </Card>
              
              <Card className="bg-card/50 p-4 justify-center gap-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-3xl font-bold">{communityBucketsCount}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>Community Buckets</CardDescription>
                </CardContent>
              </Card>
              
              <Card className="bg-card/50 p-4 justify-center gap-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-3xl font-bold">{totalManifestsCount.toLocaleString()}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>Total Package Manifests</CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}
      
      <div className="container mx-auto px-4 py-8 md:px-6">
        {/* Search form and filtering */}
        <div className="max-w-3xl mx-auto mb-8">
          <BucketSearch 
            initialQuery={query} 
            sortMode={sortMode} 
            category={category} 
            perPage={perPage} 
          />
        </div>
        
        {/* Featured buckets section (only show when no search is active) */}
        {!isSearchOrFilterActive && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-center mb-8">Featured Buckets</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredBuckets.map((bucket) => (
                <Card key={bucket.name} className="hover:shadow-md transition-shadow py-4">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-xl">{bucket.name}</CardTitle>
                      {bucket.isOfficial ? (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          <span className="text-xs">Official</span>
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-300 border-slate-200 dark:border-slate-800 flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          <span className="text-xs">Community</span>
                        </Badge>
                      )}
                    </div>
                    <CardDescription>{bucket.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex justify-between items-center mt-3">
                      <Link 
                        href={`/apps?q="${bucket.name}"`}
                        className="text-primary flex items-center hover:underline text-sm"
                      >
                        <PackageOpen className="mr-1 h-3.5 w-3.5" />
                        View Packages
                      </Link>
                      <a 
                        href={bucket.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground text-sm flex items-center"
                      >
                        <Github className="mr-1 h-3.5 w-3.5" />
                        GitHub
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        {/* "What are buckets" section (only show when no search is active) */}
        {!isSearchOrFilterActive && (
          <div className="mt-20 bg-card border rounded-xl p-8 text-card-foreground">
            <div className="flex flex-col lg:flex-row gap-8 items-center">
              <div className="lg:w-2/3">
                <h2 className="text-2xl font-bold mb-4">What are Scoop Buckets?</h2>
                <p className="mb-4">
                  Buckets are collections of package manifests (JSON files) that tell Scoop how to install applications.
                  Think of them as repositories of installation recipes for various applications.
                </p>
                <p className="mb-4">
                  Official buckets are maintained by the Scoop team and undergo rigorous testing,
                  while community buckets are created and maintained by the broader Scoop community.
                </p>
                <div className="mt-6">
                  <h3 className="text-xl font-semibold mb-3">Adding a Bucket</h3>
                  <div className="bg-muted p-4 rounded font-mono text-sm mb-4">
                    <div className="flex items-center mb-1">
                      <span className="text-primary mr-2">$</span>
                      <span>scoop bucket add extras</span>
                    </div>
                    <div className="text-muted-foreground">
                      # This adds the 'extras' bucket to your Scoop installation
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="lg:w-1/3 bg-muted/50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <FileCode className="mr-2 h-5 w-5 text-primary" />
                  Anatomy of a Bucket
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Terminal className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                    <div>
                      <span className="font-medium">JSON Manifests</span>
                      <p className="text-sm text-muted-foreground">Simple and readable application definitions</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Terminal className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                    <div>
                      <span className="font-medium">Version Control</span>
                      <p className="text-sm text-muted-foreground">Git-based for easy contribution and updates</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Terminal className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                    <div>
                      <span className="font-medium">Community Driven</span>
                      <p className="text-sm text-muted-foreground">Anyone can create and share buckets</p>
                    </div>
                  </li>
                </ul>
                <div className="mt-6">
                  <a 
                    href="https://github.com/ScoopInstaller/Scoop/wiki/Buckets"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary flex items-center hover:underline"
                  >
                    <Github className="mr-2 h-4 w-4" />
                    Learn more about buckets
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Bucket listings section */}
        <div className={`${isSearchOrFilterActive ? 'mt-6' : 'mt-20'}`}>
          <h2 className="text-2xl font-bold mb-6">Browse All Buckets</h2>
          
          <div className="flex flex-col md:flex-row items-start justify-between gap-4 mb-6">
            <div className="w-full md:w-auto">
              <BucketsCategoryTabs 
                category={category}
                query={query}
                sortMode={sortMode}
                perPage={perPage}
              />
            </div>
            
            <div className="w-full md:w-auto">
              <BucketsFilter 
                perPage={perPage}
                perPageOptions={perPageOptions}
                sortMode={sortMode}
                sortModes={sortModes}
              />
            </div>
          </div>
          
          {/* Display current results info */}
          {query && (
            <div className="my-4 text-sm">
              <p className="text-muted-foreground">
                Found <span className="font-medium text-foreground">{totalBuckets}</span> buckets matching "{query}"
              </p>
            </div>
          )}
          
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
        
        {/* Call to action section */}
        <div className="mt-20 mb-8">
          <div className="bg-card border rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Create Your Own Bucket</h3>
              <p className="text-muted-foreground mb-0 max-w-xl">
                Don't see what you're looking for? You can easily create and share your own bucket with the Scoop community.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" asChild>
                <a 
                  href="https://github.com/ScoopInstaller/Scoop/wiki/Buckets"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FileCode className="mr-2 h-4 w-4" />
                  Bucket Documentation
                </a>
              </Button>
              <Button asChild>
                <a 
                  href="https://github.com/ScoopInstaller/Scoop/wiki/App-Manifests"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="mr-2 h-4 w-4" />
                  Create Manifests
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
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