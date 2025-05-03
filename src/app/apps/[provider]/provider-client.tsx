'use client';

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Users, ChevronLeft, MoreHorizontal, ChevronRight as ChevronRightIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { API_CONFIG } from '@/lib/api-config';
import { Skeleton } from "@/components/ui/skeleton";
import { SearchInput } from "@/components/search/search-input";
import { Organization, RepositoryFacetItem } from "@/types/app";

export default function ProviderPageClient({ initialProvider }: { initialProvider: string }) {
  const provider = initialProvider;
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const query = searchParams.get("q") || "";
  const pageParam = searchParams.get("p") || "1";
  const perPageParam = searchParams.get("per_page") || "20";
  
  const [allOrganizations, setAllOrganizations] = useState<Organization[]>([]);
  const [filteredOrganizations, setFilteredOrganizations] = useState<Organization[]>([]);
  const [displayedOrganizations, setDisplayedOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(query);
  const [currentPage, setCurrentPage] = useState(parseInt(pageParam, 10));
  const [perPage, setPerPage] = useState(parseInt(perPageParam, 10));
  const [totalPages, setTotalPages] = useState(1);
  
  // Fetch all organizations on component mount
  useEffect(() => {
    async function fetchOrganizations() {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch official repositories
        const officialFacets = await fetchOrgsByType(true);
        // Fetch community repositories
        const communityFacets = await fetchOrgsByType(false);
        // Combine all facets
        const allFacets = [...officialFacets, ...communityFacets];
        
        // Process and group by organization
        const organizations = processOrganizationFacets(allFacets);
        
        // Sort by manifests (desc) then by name (asc)
        const sortedOrgs = organizations.sort((a, b) => {
          if (a.manifests !== b.manifests) {
            return b.manifests - a.manifests;
          }
          return a.name.localeCompare(b.name);
        });
        
        setAllOrganizations(sortedOrgs);
      } catch (err) {
        console.error("Error fetching organizations:", err);
        setError("Failed to load organizations. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    
    fetchOrganizations();
  }, [provider]);
  
  // Filter organizations when search query or all orgs change
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredOrganizations(allOrganizations);
    } else {
      const filtered = allOrganizations.filter(org => 
        org.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredOrganizations(filtered);
    }
    
    // Reset to page 1 when changing filters
    setCurrentPage(1);
  }, [allOrganizations, searchQuery]);
  
  // Update displayed organizations and pagination when filtered orgs or page changes
  useEffect(() => {
    // Calculate total pages
    const total = Math.max(1, Math.ceil(filteredOrganizations.length / perPage));
    setTotalPages(total);
    
    // Ensure current page is valid
    const validPage = Math.min(Math.max(1, currentPage), total);
    if (validPage !== currentPage) {
      setCurrentPage(validPage);
    }
    
    // Calculate slice indices
    const startIndex = (validPage - 1) * perPage;
    const endIndex = startIndex + perPage;
    
    // Update displayed organizations
    setDisplayedOrganizations(filteredOrganizations.slice(startIndex, endIndex));
  }, [filteredOrganizations, currentPage, perPage]);
  
  // Update URL when page or search changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (currentPage !== 1) {
      params.set("p", currentPage.toString());
    } else {
      params.delete("p");
    }
    
    if (searchQuery) {
      params.set("q", searchQuery);
    } else {
      params.delete("q");
    }
    
    if (perPage !== 20) {
      params.set("per_page", perPage.toString());
    } else {
      params.delete("per_page");
    }
    
    // Update URL without refresh
    const newUrl = `/apps/${provider}${params.toString() ? `?${params.toString()}` : ""}`;
    router.push(newUrl, { scroll: false });
  }, [currentPage, searchQuery, perPage, provider, router, searchParams]);
  
  // Handle search submit
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };
  
  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo(0, 0);
  };
  
  // Helper function to fetch organizations by type
  async function fetchOrgsByType(isOfficial: boolean) {
    try {
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
        throw new Error(`Organization request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Different ways the API might return facets
      let facets = [];
      
      // Case 1: Standard expected format
      if (data.facets && data.facets['Metadata/Repository']) {
        facets = data.facets['Metadata/Repository'];
      } 
      // Case 2: '@search.facets' format (from docs)
      else if (data['@search.facets'] && data['@search.facets']['Metadata/Repository']) {
        facets = data['@search.facets']['Metadata/Repository'];
      }
      // Case 3: No facets found
      else {
        console.warn('Unexpected API response structure:', data);
        return [];
      }
      
      return facets || [];
    } catch (error) {
      console.error(`Error fetching ${isOfficial ? 'official' : 'community'} organizations:`, error);
      throw error;
    }
  }
  
  // Helper function to process and group facets by organization
  function processOrganizationFacets(facets: RepositoryFacetItem[]) {
    const orgMap = new Map<string, { buckets: Set<string>, manifests: number, official: boolean }>();
    
    facets.forEach(item => {
      const repoUrl = item.value;
      const count = item.count;
      const isOfficial = item.isOfficial || false; // This might not be directly available
      
      if (!repoUrl || !repoUrl.startsWith(`https://${provider}/`)) {
        return; // Skip repos from other providers
      }
      
      const parts = repoUrl.split('/');
      if (parts.length < 4) return; // Skip invalid URLs
      
      const orgName = parts[3]; // parts[0] is "https:", parts[1] is "", parts[2] is provider, parts[3] is org
      const bucketName = parts[4]; // parts[4] is bucket name
      
      if (!orgName || !bucketName) return;
      
      if (!orgMap.has(orgName)) {
        orgMap.set(orgName, { 
          buckets: new Set(), 
          manifests: 0,
          official: isOfficial 
        });
      }
      
      const orgInfo = orgMap.get(orgName)!;
      orgInfo.buckets.add(bucketName);
      orgInfo.manifests += count;
      // If any bucket is official, mark the organization as official
      if (isOfficial) {
        orgInfo.official = true;
      }
    });
    
    // Convert map to array
    return Array.from(orgMap.entries()).map(([name, info]) => ({
      name,
      buckets: info.buckets.size,
      manifests: info.manifests,
      official: info.official
    }));
  }
  
  // Render skeleton loaders during initial loading
  if (loading && allOrganizations.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 md:px-6">
        <div className="flex items-center gap-1 mb-6 text-sm">
          <Link href="/apps" className="text-primary hover:underline">
            Apps
          </Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{provider}</span>
        </div>
        
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6" />
              Organizations on {provider}
            </h1>
          </div>
          
          <div className="mb-6">
            <div className="w-full max-w-md">
              <Skeleton className="h-12 w-full rounded-md" />
            </div>
          </div>
          
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[240px]">Organization</TableHead>
                  <TableHead className="text-right">Buckets</TableHead>
                  <TableHead className="text-right">Manifests</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-6 w-40" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-6 w-12 ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-6 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 md:px-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2 text-destructive">Error</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button 
            className="mt-4" 
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:px-6">
      <div className="flex items-center gap-1 mb-6 text-sm">
        <Link href="/apps" className="text-primary hover:underline">
          Apps
        </Link>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{provider}</span>
      </div>
      
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Organizations on {provider}
          </h1>
        </div>
        
        <div className="mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="w-full md:flex-1">
              <SearchInput
                initialQuery={searchQuery}
                placeholder={`Search organizations...`}
                className="w-full"
                inputHeight="h-12"
                buttonText="Search"
                onSearch={handleSearch}
              />
            </div>
            
            <div className="flex items-center gap-2 h-12">
              <span className="text-sm text-muted-foreground">Items per page:</span>
              <select
                value={perPage}
                onChange={(e) => setPerPage(parseInt(e.target.value, 10))}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              >
                {[10, 20, 50, 100].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[240px]">Organization</TableHead>
                <TableHead className="text-right">Buckets</TableHead>
                <TableHead className="text-right">Manifests</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedOrganizations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    {filteredOrganizations.length === 0 
                      ? (allOrganizations.length === 0
                          ? `No organizations found on ${provider}.`
                          : "No organizations found matching your search.")
                      : "No organizations found matching your criteria."}
                  </TableCell>
                </TableRow>
              ) : displayedOrganizations.map((org) => (
                <TableRow key={org.name}>
                  <TableCell>
                    <Link
                      href={`/apps/${provider}/${org.name}`}
                      className="hover:underline text-primary font-medium"
                    >
                      {org.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {org.buckets}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {org.manifests.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <div className="py-4 flex flex-col md:flex-row justify-between items-center px-4 text-sm text-muted-foreground">
            <div>
              Showing {displayedOrganizations.length} of {filteredOrganizations.length} organizations
              {allOrganizations.length !== filteredOrganizations.length && 
                ` (filtered from ${allOrganizations.length} total)`}
            </div>
            <div className="mt-2 md:mt-0">
              Page {currentPage} of {totalPages}
            </div>
          </div>
        </div>
        
        {/* Client-side pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex justify-center">
            <ClientPagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Client-side pagination component
function ClientPagination({ 
  currentPage,
  totalPages,
  onPageChange
}: { 
  currentPage: number; 
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  // Create pagination items with ellipsis
  const generatePaginationItems = () => {
    const items = [];
    const PAGINATION_OFFSET = 2; // Show 2 pages before and after current
    
    // Always show first page
    items.push({
      page: 1,
      current: currentPage === 1,
    });
    
    let startPage = Math.max(2, currentPage - PAGINATION_OFFSET);
    let endPage = Math.min(totalPages - 1, currentPage + PAGINATION_OFFSET);
    
    // Adjust to show consistent number of pages
    const pagesToShow = PAGINATION_OFFSET * 2 + 1;
    const numVisiblePages = endPage - startPage + 1;
    
    if (numVisiblePages < pagesToShow) {
      // If we're showing fewer pages than we want to show
      if (startPage === 2) {
        // We're at the start, so add more to the end
        endPage = Math.min(totalPages - 1, endPage + (pagesToShow - numVisiblePages));
      } else if (endPage === totalPages - 1) {
        // We're at the end, so add more to the start
        startPage = Math.max(2, startPage - (pagesToShow - numVisiblePages));
      }
    }
    
    // Add ellipsis after first page if needed
    if (startPage > 2) {
      items.push({ ellipsis: true, position: 'start' });
    }
    
    // Add middle pages
    for (let i = startPage; i <= endPage; i++) {
      items.push({
        page: i,
        current: currentPage === i,
      });
    }
    
    // Add ellipsis before last page if needed
    if (endPage < totalPages - 1) {
      items.push({ ellipsis: true, position: 'end' });
    }
    
    // Always show last page (if different from first)
    if (totalPages > 1) {
      items.push({
        page: totalPages,
        current: currentPage === totalPages,
      });
    }
    
    return items;
  };
  
  const items = generatePaginationItems();
  
  return (
    <div className="flex items-center justify-center space-x-1">
      <Button 
        variant="outline" 
        size="icon"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage <= 1}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Previous page</span>
      </Button>
      
      {items.map((item, index) => {
        // For ellipsis
        if ('ellipsis' in item) {
          return (
            <Button 
              key={`ellipsis-${item.position}-${index}`}
              variant="outline" 
              size="icon" 
              disabled
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">More pages</span>
            </Button>
          );
        }
        
        // For page numbers
        return (
          <Button
            key={`page-${item.page}`}
            variant={item.current ? "default" : "outline"}
            size="icon"
            onClick={() => onPageChange(item.page as number)}
            aria-current={item.current ? 'page' : undefined}
          >
            {item.page}
          </Button>
        );
      })}
      
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage >= totalPages}
      >
        <ChevronRightIcon className="h-4 w-4" />
        <span className="sr-only">Next page</span>
      </Button>
    </div>
  );
}