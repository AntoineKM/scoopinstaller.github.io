import { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Users } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { API_CONFIG } from '@/lib/api-config';
import { OrganizationSearchServerWrapper } from "@/components/search/organization-search-server-wrapper";

// Generate static params for common providers
export async function generateStaticParams() {
  return [
    { provider: 'github.com' },
    // Add other common providers if needed
  ];
}

// Add metadata for SEO
export async function generateMetadata({ 
  params 
}: { 
  params: { provider: string } 
}): Promise<Metadata> {
  const { provider } = await params;
  return {
    title: `Organizations on ${provider} | Scoop`,
    description: `Browse organizations hosting Scoop buckets on ${provider}`,
  };
}

// Set revalidation time to ensure the page refreshes periodically
export const revalidate = 3600; // Revalidate every hour

async function getOrganizations(provider: string, query?: string) {
  try {
    // We need to fetch both official and community organizations
    const fetchOrgsByType = async (isOfficial: boolean) => {
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
        console.error('Unexpected API response structure:', data);
        return [];
      }
      
      return facets;
    };
    
    // Fetch both organizational types
    const officialFacets = await fetchOrgsByType(true);
    const communityFacets = await fetchOrgsByType(false);
    const allFacets = [...officialFacets, ...communityFacets];
    
    // Group repositories by organization
    const orgMap = new Map<string, { buckets: Set<string>, manifests: number, official: boolean }>();
    
    allFacets.forEach(item => {
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
    
    // Convert map to array and sort by organization name
    let orgs = Array.from(orgMap.entries()).map(([name, info]) => ({
      name,
      buckets: info.buckets.size,
      manifests: info.manifests,
      official: info.official
    }));
    
    // Filter by query if provided
    if (query) {
      const searchQuery = query.toLowerCase();
      orgs = orgs.filter(org => org.name.toLowerCase().includes(searchQuery));
    }
    
    // Sort by number of manifests, then by name
    orgs.sort((a, b) => {
      if (a.manifests !== b.manifests) {
        return b.manifests - a.manifests; // Highest manifest count first
      }
      return a.name.localeCompare(b.name); // Alphabetical by name
    });
    
    return orgs;
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return [];
  }
}

export default async function ProviderPage({ 
  params,
  searchParams
}: { 
  params: { provider: string }, 
  searchParams: { q?: string, p?: string, per_page?: string }
}) {
  // Await the params and searchParams to get their values
  const { provider } = await params;
  const search = await searchParams;
  
  // Available items per page options
  const perPageOptions = [10, 20, 50, 100];
  
  // Read URL parameters
  const query = search.q || "";
  const page = parseInt(search.p || "1", 10);
  const perPage = parseInt(search.per_page || "20", 10);
  
  // Fetch organizations
  const organizations = await getOrganizations(provider, query);
  
  // Calculate pagination values
  const totalCount = organizations.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (currentPage - 1) * perPage;
  const endIndex = startIndex + perPage;
  const displayedOrganizations = organizations.slice(startIndex, endIndex);
  
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
          <OrganizationSearchServerWrapper 
            initialQuery={query} 
            provider={provider}
            page={page}
            perPage={perPage}
          />
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
                    {organizations.length === 0 
                      ? `No organizations found on ${provider}.` 
                      : "No organizations found matching your search."}
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
              Showing {displayedOrganizations.length} of {totalCount} organizations
            </div>
            <div className="mt-2 md:mt-0">
              Page {currentPage} of {totalPages}
            </div>
          </div>
        </div>
        
        {/* Pagination controlled by client component */}
        {totalPages > 1 && (
          <div className="mt-4 flex justify-center">
            <ServerPagination 
              currentPage={currentPage}
              totalPages={totalPages}
              provider={provider}
              query={query}
              perPage={perPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Server-side pagination component (using links for navigation)
function ServerPagination({ 
  currentPage, 
  totalPages,
  provider,
  query,
  perPage
}: { 
  currentPage: number; 
  totalPages: number;
  provider: string;
  query: string;
  perPage: number;
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
  
  // Create URL for pagination links
  const createPageUrl = (page: number) => {
    const params = new URLSearchParams();
    
    if (page !== 1) {
      params.set('p', page.toString());
    }
    
    if (query) {
      params.set('q', query);
    }
    
    if (perPage !== 20) {
      params.set('per_page', perPage.toString());
    }
    
    return `/apps/${provider}${params.toString() ? `?${params.toString()}` : ''}`;
  };
  
  const items = generatePaginationItems();
  
  return (
    <div className="flex items-center justify-center space-x-1">
      <Link 
        href={createPageUrl(Math.max(1, currentPage - 1))}
        className={`relative inline-flex items-center justify-center h-9 w-9 rounded-md border text-sm font-medium shadow-sm ${
          currentPage <= 1 
            ? 'border-border bg-muted text-muted-foreground cursor-not-allowed' 
            : 'border-border bg-background text-foreground hover:bg-accent'
        }`}
        aria-disabled={currentPage <= 1}
        tabIndex={currentPage <= 1 ? -1 : undefined}
        scroll={false}
      >
        <span className="sr-only">Previous page</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <path d="m15 18-6-6 6-6" />
        </svg>
      </Link>
      
      {items.map((item, index) => {
        // For ellipsis
        if ('ellipsis' in item) {
          return (
            <span 
              key={`ellipsis-${item.position}-${index}`}
              className="relative inline-flex items-center justify-center h-9 w-9 rounded-md border border-border bg-muted text-muted-foreground"
            >
              <span className="sr-only">More pages</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <circle cx="12" cy="12" r="1" />
                <circle cx="19" cy="12" r="1" />
                <circle cx="5" cy="12" r="1" />
              </svg>
            </span>
          );
        }
        
        // For page numbers
        return (
          <Link
            key={`page-${item.page}`}
            href={createPageUrl(item.page)}
            className={`relative inline-flex items-center justify-center h-9 w-9 rounded-md text-sm font-medium shadow-sm ${
              item.current 
                ? 'bg-primary text-primary-foreground' 
                : 'border border-border bg-background text-foreground hover:bg-accent'
            }`}
            aria-current={item.current ? 'page' : undefined}
            scroll={false}
          >
            {item.page}
          </Link>
        );
      })}
      
      <Link 
        href={createPageUrl(Math.min(totalPages, currentPage + 1))}
        className={`relative inline-flex items-center justify-center h-9 w-9 rounded-md border text-sm font-medium shadow-sm ${
          currentPage >= totalPages 
            ? 'border-border bg-muted text-muted-foreground cursor-not-allowed' 
            : 'border-border bg-background text-foreground hover:bg-accent'
        }`}
        aria-disabled={currentPage >= totalPages}
        tabIndex={currentPage >= totalPages ? -1 : undefined}
        scroll={false}
      >
        <span className="sr-only">Next page</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </Link>
    </div>
  );
}