"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SearchForm } from "@/components/search/search-form";
import { ActiveFilters } from "@/components/search/active-filters";
import { SearchIntro } from "@/components/search/search-intro";
import { PopularApps } from "@/components/search/popular-apps";
import { SearchEmpty } from "@/components/search/search-empty";
import { SearchResultsView } from "@/components/search/search-results-view";
import { SearchBottomCTA } from "@/components/search/search-bottom-cta";
import { API_CONFIG } from '@/lib/api-config';

// Sort modes for search
export const sortModes = [
  {
    id: 0,
    name: "Best match",
    icon: "sort-desc",
    description: "Sort by relevance to your search query",
    defaultDirection: 1, // Descending
  },
  {
    id: 1,
    name: "Name",
    icon: "arrow-down-a-z",
    description: "Sort alphabetically by name",
    defaultDirection: 0, // Ascending
  },
  {
    id: 2,
    name: "Newest",
    icon: "calendar-days",
    description: "Sort by most recently updated",
    defaultDirection: 1, // Descending
  },
];

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get search parameters from URL
  const query = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("p") || "1", 10);
  const sortIndex = parseInt(searchParams.get("s") || "0", 10);
  const sortDirection = parseInt(searchParams.get("d") || sortModes[sortIndex]?.defaultDirection.toString() || "1", 10);
  const officialOnly = searchParams.get("o") !== "false";
  const distinctOnly = searchParams.get("dm") !== "false";
  const showBucketName = searchParams.get("n") !== "false";
  
  // State variables
  const [results, setResults] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [officialRepositories, setOfficialRepositories] = useState({});
  const [searchInput, setSearchInput] = useState(query);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [showFeaturedApps, setShowFeaturedApps] = useState(true);
  
  const RESULTS_PER_PAGE = 20;
  const currentSortMode = sortModes.find(mode => mode.id === sortIndex) || sortModes[0];

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

  // Fetch search results when parameters change
  useEffect(() => {
    // Don't search on the first render if there's no query
    if (isFirstLoad && !query) {
      setIsFirstLoad(false);
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
        
        // Get sort order from configuration
        const orderBy = API_CONFIG.sortModes[sortIndex].OrderBy[sortDirection].join(', ');
        
        // Prepare search request
        const searchRequest = {
          count: true,
          search: query.trim(),
          searchMode: "all",
          filter: filters.join(' and '),
          orderby: orderBy,
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
        
        // Get result count
        const totalCount = data['@odata.count'] || 0;
        
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
        // Hide featured apps once we have searched for something
        setShowFeaturedApps(false);
      } catch (error) {
        console.error("Error fetching search results:", error);
        setResults([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
        setIsFirstLoad(false);
      }
    };
    
    if (query.trim() || page !== 1 || sortIndex !== 0 || !officialOnly || !distinctOnly) {
      fetchSearchResults();
      // Hide featured apps when we're doing an actual search
      setShowFeaturedApps(false);
    } else {
      setResults([]);
      setTotalCount(0);
      setLoading(false);
      // When no search is performed, show featured apps
      setShowFeaturedApps(true);
    }
  }, [query, page, sortIndex, sortDirection, officialOnly, distinctOnly, officialRepositories, isFirstLoad]);

  // Handle search submission
  const handleSearch = (e) => {
    e.preventDefault();
    
    const params = new URLSearchParams(searchParams.toString());
    if (searchInput.trim()) {
      params.set("q", searchInput.trim());
    } else {
      params.delete("q");
    }
    
    // Reset to page 1 when searching
    params.delete("p");
    
    const queryString = params.toString() ? `?${params.toString()}` : "";
    router.push(`/apps${queryString}`);
  };

  // Update search parameters
  const updateSearchParams = (key, value, defaultValue) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value === defaultValue) {
      params.delete(key);
    } else {
      params.set(key, value.toString());
    }
    
    // Reset to page 1 when changing filters
    if (key !== "p") {
      params.delete("p");
    }
    
    const queryString = params.toString() ? `?${params.toString()}` : "";
    router.push(`/apps${queryString}`, { scroll: false });
    
    // Save preference to localStorage for some settings
    if (key === "o" || key === "dm" || key === "n" || key === "s" || key === "d") {
      localStorage.setItem(key, value.toString());
    }
  };

  // Toggle sort
  const toggleSort = (newSortIndex) => {
    if (newSortIndex === sortIndex) {
      // Toggle direction if same sort
      updateSearchParams("d", sortDirection === 1 ? 0 : 1, sortModes[sortIndex].defaultDirection);
    } else {
      // Set new sort with default direction
      updateSearchParams("s", newSortIndex, 0);
      // Use default direction for that sort mode
      updateSearchParams("d", sortModes[newSortIndex].defaultDirection, sortModes[newSortIndex].defaultDirection);
    }
  };

  return (
    <div>
      {/* Hero Section with gradient background similar to homepage */}
      <div className="bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 py-8 md:px-6">
          {/* Search form in hero */}
          <SearchForm 
            searchInput={searchInput}
            setSearchInput={setSearchInput}
            handleSearch={handleSearch}
            sortIndex={sortIndex}
            sortDirection={sortDirection}
            officialOnly={officialOnly}
            distinctOnly={distinctOnly}
            showBucketName={showBucketName}
            updateSearchParams={updateSearchParams}
          />
          
          {/* Active filters display */}
          {(query || sortIndex !== 0 || !officialOnly || !distinctOnly) && (
            <ActiveFilters 
              query={query}
              sortIndex={sortIndex}
              sortDirection={sortDirection}
              officialOnly={officialOnly}
              distinctOnly={distinctOnly}
              sortModes={sortModes}
              updateSearchParams={updateSearchParams}
              router={router}
              searchParams={searchParams}
            />
          )}
        </div>
      </div>
        
      <div className="container mx-auto px-4 md:px-6">
        {/* Different content states */}
        {isFirstLoad || showFeaturedApps ? (
          <>
            <SearchIntro />
            <PopularApps />
          </>
        ) : !query && results.length === 0 ? (
          <SearchEmpty />
        ) : (
          <SearchResultsView
            loading={loading}
            totalCount={totalCount}
            query={query}
            sortIndex={sortIndex}
            sortModes={sortModes}
            toggleSort={toggleSort}
            results={results}
            officialOnly={officialOnly}
            showBucketName={showBucketName}
            RESULTS_PER_PAGE={RESULTS_PER_PAGE}
            page={page}
          />
        )}
        
        {/* Bottom CTA */}
        <SearchBottomCTA />
      </div>
    </div>
  );
}