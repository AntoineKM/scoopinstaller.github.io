"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle, AlertCircle, Star, ArrowUpDown } from "lucide-react";
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

type Bucket = {
  bucket: string;
  manifests: number;
  official: boolean;
  stars?: number;
};

const sortModes = ["Default", "Name", "Manifests"];

// Import API configuration
import { API_CONFIG } from '@/lib/api-config';

export default function BucketsPage() {
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortMode, setSortMode] = useState("Default");
  
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
          
          // Debug log to see the actual structure
          console.log('API Response for buckets:', data);
          
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
          
          return facets.map(item => ({
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
        setBuckets(sortBuckets(allBuckets, sortMode));
      } catch (error) {
        console.error("Error fetching buckets:", error);
        setBuckets([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBuckets();
  }, [sortMode]);
  
  const sortBuckets = (bucketsToSort: Bucket[], mode: string): Bucket[] => {
    const bucketsCopy = [...bucketsToSort];
    
    switch (mode) {
      case "Default":
        return bucketsCopy.sort((a, b) => {
          // First by official status
          if (a.official !== b.official) {
            return a.official ? -1 : 1;
          }
          // Then by bucket name
          return extractBucketName(a.bucket).localeCompare(extractBucketName(b.bucket));
        });
      
      case "Name":
        return bucketsCopy.sort((a, b) => 
          extractBucketName(a.bucket).localeCompare(extractBucketName(b.bucket))
        );
      
      case "Manifests":
        return bucketsCopy.sort((a, b) => b.manifests - a.manifests);
      
      default:
        return bucketsCopy;
    }
  };
  
  const extractBucketName = (bucketUrl: string): string => {
    const parts = bucketUrl.split('/');
    return parts[parts.length - 1];
  };
  
  const handleSortChange = (value: string) => {
    setSortMode(value);
  };
  
  return (
    <div className="container mx-auto px-4 py-8 md:px-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Scoop Buckets</h1>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <Select value={sortMode} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[140px]">
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
              {buckets.map((bucket) => (
                <TableRow key={bucket.bucket}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/apps?q="${encodeURIComponent(bucket.bucket)}"${bucket.official ? '' : '&o=false'}`}
                        className="hover:underline text-primary"
                      >
                        {extractBucketName(bucket.bucket)}
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
  );
}