"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/pagination";
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
import { API_CONFIG } from '@/lib/api-config';

type Organization = {
  name: string;
  buckets: number;
  manifests: number;
};

export default function ProviderPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const provider = params.provider as string;
  
  // Available items per page options
  const perPageOptions = [10, 20, 50, 100];
  
  // Read URL parameters
  const query = searchParams.get("q") || "";
  const currentPage = parseInt(searchParams.get("p") || "1", 10);
  const itemsPerPage = parseInt(searchParams.get("per_page") || "20", 10);
  
  // State for pagination and data
  const [page, setPage] = useState(currentPage);
  const [perPage, setPerPage] = useState(
    perPageOptions.includes(itemsPerPage) ? itemsPerPage : 20
  );
  const [searchQuery, setSearchQuery] = useState(query);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [filteredOrganizations, setFilteredOrganizations] = useState<Organization[]>([]);
  const [displayedOrganizations, setDisplayedOrganizations] = useState<Organization[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  
  // Update state when URL parameters change
  useEffect(() => {
    // Only update state if the values have actually changed to prevent infinite loops
    if (page !== currentPage) {
      setPage(currentPage);
    }
    
    const newPerPage = perPageOptions.includes(itemsPerPage) ? itemsPerPage : 20;
    if (perPage !== newPerPage) {
      setPerPage(newPerPage);
    }
    
    if (searchQuery !== query) {
      setSearchQuery(query);
    }
  }, [currentPage, itemsPerPage, query, perPageOptions, page, perPage, searchQuery]);

  // Fetch organizations data
  useEffect(() => {
    const fetchOrganizations = async () => {
      setLoading(true);
      
      try {
        // Fetch all repositories
        const response = await fetch(API_CONFIG.getSearchUrl(), {
          method: 'POST',
          headers: API_CONFIG.getSearchHeaders(),
          body: JSON.stringify({
            count: true,
            facets: ['Metadata/Repository,count:10000'],
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
          console.error('Unexpected API response structure:', data);
          setLoading(false);
          return;
        }
        
        // Group repositories by organization
        const orgMap = new Map<string, { buckets: Set<string>, manifests: number }>();
        
        facets.forEach(item => {
          const repoUrl = item.value;
          const count = item.count;
          
          if (!repoUrl || !repoUrl.startsWith(`https://${provider}/`)) {
            return; // Skip repos from other providers
          }
          
          const parts = repoUrl.split('/');
          if (parts.length < 4) return; // Skip invalid URLs
          
          const orgName = parts[3]; // parts[0] is "https:", parts[1] is "", parts[2] is provider, parts[3] is org
          const bucketName = parts[4]; // parts[4] is bucket name
          
          if (!orgName || !bucketName) return;
          
          if (!orgMap.has(orgName)) {
            orgMap.set(orgName, { buckets: new Set(), manifests: 0 });
          }
          
          const orgInfo = orgMap.get(orgName)!;
          orgInfo.buckets.add(bucketName);
          orgInfo.manifests += count;
        });
        
        // Convert map to array and sort by organization name
        const orgs = Array.from(orgMap.entries()).map(([name, info]) => ({
          name,
          buckets: info.buckets.size,
          manifests: info.manifests
        }));
        
        // Sort by number of manifests, then by name
        orgs.sort((a, b) => {
          if (a.manifests !== b.manifests) {
            return b.manifests - a.manifests; // Highest manifest count first
          }
          return a.name.localeCompare(b.name); // Alphabetical by name
        });
        
        setOrganizations(orgs);
        setFilteredOrganizations(orgs);
      } catch (error) {
        console.error("Error fetching organizations:", error);
        setOrganizations([]);
        setFilteredOrganizations([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrganizations();
  }, [provider]);

  // Filter organizations when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredOrganizations(organizations);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = organizations.filter(org => 
        org.name.toLowerCase().includes(query)
      );
      setFilteredOrganizations(filtered);
    }
    
    // Reset to first page when filters change, but only if we're not already on page 1
    if (page !== 1 && filteredOrganizations.length > 0) {
      goToPage(1);
    }
  }, [searchQuery, organizations]);
  
  // Update displayed organizations based on pagination
  useEffect(() => {
    // Calculate starting and ending indices for the current page
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    
    // Slice the filtered organizations array to get only the items for this page
    const displayedOrgs = filteredOrganizations.slice(startIndex, endIndex);
    setDisplayedOrganizations(displayedOrgs);
    
    // Calculate total pages
    const totalPagesCount = Math.max(1, Math.ceil(filteredOrganizations.length / perPage));
    setTotalPages(totalPagesCount);
    
    // If current page is out of range, go to the last page
    if (page > totalPagesCount && filteredOrganizations.length > 0 && totalPagesCount > 0) {
      // But only if we're not already redirecting
      if (page !== totalPagesCount) {
        goToPage(totalPagesCount);
      }
    }
  }, [filteredOrganizations, page, perPage]);
  
  const goToPage = (newPage: number) => {
    if (newPage === page) return; // Prevent unnecessary updates
    
    const params = new URLSearchParams(searchParams.toString());
    
    if (newPage !== 1) {
      params.set("p", newPage.toString());
    } else {
      params.delete("p");
    }
    
    const queryString = params.toString() ? `?${params.toString()}` : "";
    router.push(`/apps/${provider}${queryString}`, { scroll: false });
  };
  
  const handlePerPageChange = (value: string) => {
    const numValue = parseInt(value, 10);
    setPerPage(numValue);
    
    const params = new URLSearchParams(searchParams.toString());
    
    if (numValue !== 20) {
      params.set("per_page", value);
    } else {
      params.delete("per_page");
    }
    
    // Reset to page 1
    params.delete("p");
    
    const queryString = params.toString() ? `?${params.toString()}` : "";
    router.push(`/apps/${provider}${queryString}`, { scroll: false });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    const params = new URLSearchParams(searchParams.toString());
    if (searchQuery.trim()) {
      params.set("q", searchQuery.trim());
    } else {
      params.delete("q");
    }
    
    // Reset to page 1 when searching
    params.delete("p");
    
    const queryString = params.toString() ? `?${params.toString()}` : "";
    router.push(`/apps/${provider}${queryString}`);
  };

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
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Items per page:</span>
            <Select value={perPage.toString()} onValueChange={handlePerPageChange}>
              <SelectTrigger className="w-[80px]">
                <SelectValue placeholder="20" />
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
        </div>
        
        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder={`Search organizations...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
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
                {filteredOrganizations.length === 0 ? (
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
                Showing {displayedOrganizations.length} of {filteredOrganizations.length} organizations
              </div>
              <div className="mt-2 md:mt-0">
                Page {page} of {totalPages}
              </div>
            </div>
          </div>
        )}
        
        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="mt-4 flex justify-center">
            <Pagination 
              currentPage={page}
              totalPages={totalPages}
            />
          </div>
        )}
      </div>
    </div>
  );
}