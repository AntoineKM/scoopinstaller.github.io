"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Package, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchResults } from "@/components/search-results";
import { Pagination } from "@/components/pagination";
import { API_CONFIG } from '@/lib/api-config';
import type { AppSearchResult } from "@/types/app";

export default function BucketPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const provider = params.provider as string;
  const organization = params.organization as string;
  const bucket = params.bucket as string;
  
  const query = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("p") || "1", 10);
  const showBucketName = searchParams.get("n") !== "false";
  
  const [results, setResults] = useState<AppSearchResult[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(query);
  
  const RESULTS_PER_PAGE = 20;
  const repositoryUrl = `https://${provider}/${organization}/${bucket}`;

  useEffect(() => {
    const fetchApps = async () => {
      setLoading(true);
      
      try {
        // Create filters - specifically for the repository
        const filters = [`Metadata/Repository eq '${repositoryUrl}'`];
        
        // Prepare search request
        const searchRequest = {
          count: true,
          search: query.trim(),
          searchMode: "all",
          filter: filters.join(' and '),
          skip: (page - 1) * RESULTS_PER_PAGE,
          top: RESULTS_PER_PAGE,
          select: [
            'Id',
            'Name',
            'NamePartial',
            'NameSuffix',
            'Description',
            'Notes',
            'Homepage',
            'License',
            'Version',
            'Metadata/Repository',
            'Metadata/FilePath',
            'Metadata/OfficialRepository',
            'Metadata/RepositoryStars',
            'Metadata/Committed',
            'Metadata/Sha',
          ].join(','),
          highlight: [
            'Name',
            'NamePartial',
            'NameSuffix',
            'Description',
            'Version',
            'License',
            'Metadata/Repository',
          ].join(','),
          highlightPreTag: '<mark>',
          highlightPostTag: '</mark>',
        };
        
        const response = await fetch(API_CONFIG.getSearchUrl(), {
          method: 'POST',
          headers: API_CONFIG.getSearchHeaders(),
          body: JSON.stringify(searchRequest),
        });
        
        if (!response.ok) {
          throw new Error(`Search request failed: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Get result count from appropriate property
        const totalCount = data['@odata.count'] || 
                          data['count'] || 
                          (Array.isArray(data.value) ? data.value.length : 0);
        
        // Process the results - map them to our format
        const processedResults = (data.value || []).map(item => {
          // Helper function to safely access properties
          const safeProp = (obj, path, fallback = '') => {
            return path.split('.').reduce((acc, part) => 
              acc && acc[part] !== undefined ? acc[part] : fallback, obj);
          };
          
          // Helper function to get highlighted content
          const getHighlight = (propertyName, fallback) => {
            const highlights = item['@search.highlights'] || {};
            return highlights[propertyName] 
              ? { __html: highlights[propertyName].join(' ') } 
              : { __html: fallback || "" };
          };
          
          // Safely access metadata
          const metadata = item.Metadata || {};
          
          // Extract repository name for display
          const repository = safeProp(metadata, 'Repository', '');
          const isOfficial = safeProp(metadata, 'OfficialRepository', false);
          const formattedRepository = isOfficial
            ? repository.split('/').pop().toLowerCase()
            : repository.split('/').pop().toLowerCase();
            
          return {
            id: safeProp(item, 'Id', `item-${Math.random()}`),
            name: safeProp(item, 'Name', ''),
            nameHighlighted: getHighlight('Name', safeProp(item, 'Name', '')),
            description: safeProp(item, 'Description', ''),
            descriptionHighlighted: getHighlight('Description', safeProp(item, 'Description', '')),
            version: safeProp(item, 'Version', ''),
            versionHighlighted: getHighlight('Version', safeProp(item, 'Version', '')),
            license: safeProp(item, 'License', ''),
            licenseHighlighted: getHighlight('License', safeProp(item, 'License', '')),
            homepage: safeProp(item, 'Homepage', ''),
            repositoryUrl: repository,
            repository: formattedRepository,
            repositoryHighlighted: getHighlight('Metadata/Repository', formattedRepository),
            official: isOfficial,
            stars: safeProp(metadata, 'RepositoryStars', 0),
            committed: safeProp(metadata, 'Committed', new Date().toISOString()),
            sha: safeProp(metadata, 'Sha', ''),
            filePath: safeProp(metadata, 'FilePath', ''),
            notes: safeProp(item, 'Notes', ''),
          };
        });
        
        setResults(processedResults);
        setTotalCount(totalCount);
      } catch (error) {
        console.error("Error fetching apps:", error);
        setResults([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    };
    
    fetchApps();
  }, [repositoryUrl, query, page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set("q", searchQuery.trim());
    }
    
    // Reset to page 1 when searching
    params.set("p", "1");
    
    const queryString = params.toString() ? `?${params.toString()}` : "";
    router.push(`/apps/${provider}/${organization}/${bucket}${queryString}`);
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
        <Link href={`/apps/${provider}/${organization}`} className="text-primary hover:underline">
          {organization}
        </Link>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{bucket}</span>
      </div>
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Package className="h-6 w-6" />
          {bucket} Bucket
        </h1>
        
        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder={`Search in ${bucket}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>
        
        <div className="mb-8">
          <SearchResults
            results={results}
            loading={loading}
            query={query}
            officialOnly={false}
            showBucketName={showBucketName}
            totalCount={totalCount}
          />
        </div>
        
        {totalCount > RESULTS_PER_PAGE && (
          <div className="flex justify-center">
            <Pagination
              currentPage={page}
              totalPages={Math.ceil(totalCount / RESULTS_PER_PAGE)}
            />
          </div>
        )}
      </div>
    </div>
  );
}