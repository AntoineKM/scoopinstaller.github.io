"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SearchResults } from "@/components/search-results";
import { SearchBar } from "@/components/search-bar";
import { SearchFilters } from "@/components/search-filters";
import { Pagination } from "@/components/pagination";

// Sort modes from the original code
const sortModes = [
  {
    DisplayName: "Best match",
    DefaultSortDirection: 1, // Descending
    OrderBy: {
      0: ["search.score() asc", "Metadata/OfficialRepositoryNumber asc", "NameSortable desc"],
      1: ["search.score() desc", "Metadata/OfficialRepositoryNumber desc", "NameSortable asc"],
    },
  },
  {
    DisplayName: "Name",
    DefaultSortDirection: 0, // Ascending
    OrderBy: {
      0: [
        "NameSortable asc",
        "Metadata/OfficialRepositoryNumber desc",
        "Metadata/RepositoryStars desc",
        "Metadata/Committed desc",
      ],
      1: [
        "NameSortable desc",
        "Metadata/OfficialRepositoryNumber asc",
        "Metadata/RepositoryStars asc",
        "Metadata/Committed asc",
      ],
    },
  },
  {
    DisplayName: "Newest",
    DefaultSortDirection: 1, // Descending
    OrderBy: {
      0: [
        "Metadata/Committed asc",
        "Metadata/OfficialRepositoryNumber asc",
        "Metadata/RepositoryStars asc",
      ],
      1: [
        "Metadata/Committed desc",
        "Metadata/OfficialRepositoryNumber desc",
        "Metadata/RepositoryStars desc",
      ],
    },
  },
];

// Import API configuration
import { API_CONFIG } from '@/lib/api-config';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("p") || "1", 10);
  const sortIndex = parseInt(searchParams.get("s") || "0", 10);
  const sortDirection = parseInt(searchParams.get("d") || "1", 10);
  const officialOnly = searchParams.get("o") !== "false";
  const distinctOnly = searchParams.get("dm") !== "false";
  const showBucketName = searchParams.get("n") !== "false";
  
  const [results, setResults] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [officialRepositories, setOfficialRepositories] = useState({});
  const RESULTS_PER_PAGE = 20;

  // Fetch official repositories mapping
  useEffect(() => {
    const fetchOfficialRepos = async () => {
      try {
        const response = await fetch('https://cdn.jsdelivr.net/gh/ScoopInstaller/Scoop/buckets.json');
        if (!response.ok) throw new Error("Failed to fetch official repositories");
        
        const json = await response.json();
        const mapping = {};
        
        Object.keys(json).forEach((key) => {
          mapping[json[key]] = key;
        });
        
        setOfficialRepositories(mapping);
      } catch (error) {
        console.error("Error fetching official repositories:", error);
      }
    };
    
    fetchOfficialRepos();
  }, []);

  // Fetch search results
  useEffect(() => {
    if (!query.trim() && page === 1) {
      setResults([]);
      setTotalCount(0);
      return;
    }
    
    const fetchSearchResults = async () => {
      setLoading(true);
      
      try {
        // Create filters
        const filters = [];
        if (officialOnly) {
          filters.push('Metadata/OfficialRepositoryNumber eq 1');
        }
        
        if (distinctOnly) {
          filters.push('Metadata/DuplicateOf eq null');
        }
        
        // Prepare search request
        const searchRequest = {
          count: true,
          search: query.trim(),
          searchMode: "all",
          filter: filters.join(' and '),
          orderby: sortModes[sortIndex].OrderBy[sortDirection].join(', '),
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
        
        // Debug log to see the actual structure
        console.log('API Response for search:', data);
        
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
            ? officialRepositories[repository] || repository.split('/').pop().toLowerCase()
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
        console.error("Error fetching search results:", error);
        setResults([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSearchResults();
  }, [query, page, sortIndex, sortDirection, officialOnly, distinctOnly, officialRepositories]);

  return (
    <div className="container mx-auto px-4 py-8 md:px-6">
      <div className="mb-8">
        <SearchBar initialQuery={query} />
      </div>
      
      <div className="mb-4">
        <SearchFilters 
          sortIndex={sortIndex}
          sortDirection={sortDirection}
          officialOnly={officialOnly}
          distinctOnly={distinctOnly}
          showBucketName={showBucketName}
        />
      </div>
      
      <div className="mb-8">
        <SearchResults 
          results={results}
          loading={loading}
          query={query}
          officialOnly={officialOnly}
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
  );
}