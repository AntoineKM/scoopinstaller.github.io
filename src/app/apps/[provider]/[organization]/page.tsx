"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Search, FolderOpen, CheckCircle, AlertCircle, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { API_CONFIG } from '@/lib/api-config';
import { BucketSearchInOrg } from "@/components/search/organization-bucket-search";

type Bucket = {
  name: string;
  manifests: number;
  official: boolean;
  stars?: number;
};

export default function OrganizationPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const provider = params.provider as string;
  const organization = params.organization as string;
  
  const query = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(query);
  
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [filteredBuckets, setFilteredBuckets] = useState<Bucket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBuckets = async () => {
      setLoading(true);
      
      try {
        // Create filters - specifically for repositories from the organization
        const organizationPrefix = `https://${provider}/${organization}/`;
        
        // We need to fetch both official and community buckets
        const fetchBucketsByType = async (isOfficial: boolean) => {
          // For API compatibility, we'll use a simpler approach that works with the existing API
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
          let facets = [];
          
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
            const repoMap = {};
            data.value.forEach(item => {
              const repo = item.Metadata?.Repository;
              if (repo && repo.startsWith(organizationPrefix)) {
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
          
          return facets
            .filter(item => {
              // Only include repositories from the specified organization
              const fullRepo = item.value;
              return fullRepo && fullRepo.startsWith(organizationPrefix);
            })
            .map(item => {
              // Extract bucket name from repo URL
              const fullRepo = item.value;
              const bucketName = fullRepo.split('/').pop();
              
              return {
                name: bucketName,
                manifests: item.count,
                official: isOfficial,
                stars: isOfficial ? undefined : 0, // We don't have stars info here
              };
            });
        };
        
        // Fetch both bucket types
        const officialBuckets = await fetchBucketsByType(true);
        const communityBuckets = await fetchBucketsByType(false);
        
        // Combine and sort buckets
        const allBuckets = [...officialBuckets, ...communityBuckets].sort((a, b) => {
          // First by official status
          if (a.official !== b.official) {
            return a.official ? -1 : 1;
          }
          // Then by bucket name
          return a.name.localeCompare(b.name);
        });
        
        setBuckets(allBuckets);
        setFilteredBuckets(allBuckets);
      } catch (error) {
        console.error("Error fetching buckets:", error);
        setBuckets([]);
        setFilteredBuckets([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBuckets();
  }, [provider, organization]);

  // Filter buckets when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredBuckets(buckets);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = buckets.filter(bucket => 
        bucket.name.toLowerCase().includes(query)
      );
      setFilteredBuckets(filtered);
    }
  }, [searchQuery, buckets]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchQuery);
    // We're handling the filtering locally, so no need to update the URL
  };

  return (
    <div className="container mx-auto px-4 py-8 md:px-6">
      <div className="flex items-center gap-1 mb-6 text-sm">
        <Link href="/apps" className="text-primary hover:underline">
          Apps
        </Link>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <Link href={`/apps/${provider}`} className="text-primary hover:underline">
          {provider}
        </Link>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{organization}</span>
      </div>
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <FolderOpen className="h-6 w-6" />
          {organization}'s Buckets
        </h1>
        
        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <BucketSearchInOrg 
            initialQuery={searchQuery} 
            provider={provider} 
            organization={organization} 
          />
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
                  <TableHead className="min-w-[240px]">Bucket</TableHead>
                  <TableHead className="text-right">Manifests</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBuckets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="h-24 text-center">
                      No buckets found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : filteredBuckets.map((bucket) => (
                  <TableRow key={bucket.name}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/apps/${provider}/${organization}/${bucket.name}`}
                          className="hover:underline text-primary"
                        >
                          {bucket.name}
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
          </div>
        )}
      </div>
    </div>
  );
}