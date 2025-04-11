"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Search,
  Filter,
  PackageOpen,
  Github,
  Terminal,
  ArrowDownAZ,
  CalendarDays,
  SortDesc,
  CheckCircle2,
  SlidersHorizontal,
  Info,
  HelpCircle,
  X,
  FileCode,
  Star
} from "lucide-react";
import { SearchResults } from "@/components/search-results";
import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { API_CONFIG } from '@/lib/api-config';

// Sort modes from the original code
const sortModes = [
  {
    id: 0,
    name: "Best match",
    icon: SortDesc,
    description: "Sort by relevance to your search query",
    defaultDirection: 1, // Descending
  },
  {
    id: 1,
    name: "Name",
    icon: ArrowDownAZ,
    description: "Sort alphabetically by name",
    defaultDirection: 0, // Ascending
  },
  {
    id: 2,
    name: "Newest",
    icon: CalendarDays,
    description: "Sort by most recently updated",
    defaultDirection: 1, // Descending
  },
];

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get search parameters
  const query = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("p") || "1", 10);
  const sortIndex = parseInt(searchParams.get("s") || "0", 10);
  const sortDirection = parseInt(searchParams.get("d") || sortModes[sortIndex]?.defaultDirection.toString() || "1", 10);
  const officialOnly = searchParams.get("o") !== "false";
  const distinctOnly = searchParams.get("dm") !== "false";
  const showBucketName = searchParams.get("n") !== "false";
  
  // State for search and results
  const [results, setResults] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [officialRepositories, setOfficialRepositories] = useState({});
  const [searchInput, setSearchInput] = useState(query);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  
  // Popular apps to show when no search has been performed
  const popularApps = [
    {
      name: "git",
      description: "Distributed version control system",
      bucket: "main",
      official: true
    },
    {
      name: "vscode",
      description: "Visual Studio Code is a lightweight but powerful source code editor",
      bucket: "extras",
      official: true
    },
    {
      name: "nodejs",
      description: "JavaScript runtime built on Chrome's V8 JavaScript engine",
      bucket: "main",
      official: true
    },
    {
      name: "python",
      description: "Dynamic programming language with an emphasis on code readability",
      bucket: "main",
      official: true
    },
    {
      name: "neovim",
      description: "Hyperextensible Vim-based text editor",
      bucket: "main",
      official: true
    },
    {
      name: "firefox",
      description: "Mozilla's popular web browser",
      bucket: "extras",
      official: true
    },
    {
      name: "7zip",
      description: "File archiver with a high compression ratio",
      bucket: "main", 
      official: true
    },
    {
      name: "nvm",
      description: "Node Version Manager - POSIX-compliant bash script to manage Node.js versions",
      bucket: "main",
      official: true
    },
    {
      name: "wezterm",
      description: "GPU-accelerated cross-platform terminal emulator and multiplexer",
      bucket: "extras",
      official: true
    }
  ];
  
  const RESULTS_PER_PAGE = 20;
  const currentSortMode = sortModes.find(mode => mode.id === sortIndex) || sortModes[0];
  const SortIcon = currentSortMode.icon;

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
    } else {
      setResults([]);
      setTotalCount(0);
      setLoading(false);
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
    
    // Close filter sheet if open
    setIsFilterSheetOpen(false);
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
    <div className="container mx-auto px-4 py-8 md:px-6">
      {/* Hero section with search box */}
      <div className="mb-12">
        <div className="text-center max-w-2xl mx-auto mb-6">
          <h1 className="text-3xl font-bold mb-2">Find Scoop Packages</h1>
          <p className="text-muted-foreground">
            Search thousands of packages available across official and community buckets
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSearch} className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            
            <Input 
              type="text" 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search for applications (e.g., git, vscode, nodejs...)"
              className="pl-10 pr-24 py-6 text-base shadow-sm"
            />
            
            <div className="absolute inset-y-0 right-0 flex items-center">
              <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
                <SheetTrigger asChild>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 mr-1 gap-1.5"
                  >
                    <Filter className="h-4 w-4" />
                    <span className="sr-only md:not-sr-only">Filters</span>
                  </Button>
                </SheetTrigger>
                <SheetContent className="sm:max-w-md">
                  <SheetHeader>
                    <SheetTitle>Search Filters</SheetTitle>
                    <SheetDescription>
                      Customize your search experience with these options
                    </SheetDescription>
                  </SheetHeader>
                  
                  <ScrollArea className="h-[calc(100vh-10rem)] mt-6 pr-4">
                    <div className="space-y-6">
                      {/* Sorting section */}
                      <div>
                        <h3 className="text-sm font-medium mb-4 flex items-center gap-1.5">
                          <SortDesc className="h-4 w-4 text-muted-foreground" />
                          Sorting
                        </h3>
                        
                        <div className="grid grid-cols-1 gap-2">
                          {sortModes.map((mode) => (
                            <Card 
                              key={mode.id} 
                              className={`cursor-pointer transition-colors ${sortIndex === mode.id ? 'border-primary' : ''}`}
                              onClick={() => toggleSort(mode.id)}
                            >
                              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <mode.icon className="h-4 w-4 text-primary" />
                                  <CardTitle className="text-base">{mode.name}</CardTitle>
                                </div>
                                
                                {sortIndex === mode.id && (
                                  <Badge variant="outline" className="ml-auto">
                                    {sortDirection === 1 ? "Descending" : "Ascending"}
                                  </Badge>
                                )}
                              </CardHeader>
                              <CardContent className="p-4 pt-0">
                                <CardDescription>{mode.description}</CardDescription>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                      
                      <Separator />
                      
                      {/* Filters section */}
                      <div>
                        <h3 className="text-sm font-medium mb-4 flex items-center gap-1.5">
                          <Filter className="h-4 w-4 text-muted-foreground" />
                          Filtering
                        </h3>
                        
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label className="text-base cursor-pointer" htmlFor="official-only">
                                Official buckets only
                              </Label>
                              <div className="flex items-center gap-1.5">
                                <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                                <p className="text-sm text-muted-foreground">
                                  Show only packages from officially maintained buckets
                                </p>
                              </div>
                            </div>
                            <Switch
                              id="official-only"
                              checked={officialOnly}
                              onCheckedChange={(checked) => updateSearchParams("o", checked, true)}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label className="text-base cursor-pointer" htmlFor="distinct-only">
                                Distinct manifests only
                              </Label>
                              <p className="text-sm text-muted-foreground">
                                Filter out duplicate packages across buckets
                              </p>
                            </div>
                            <Switch
                              id="distinct-only"
                              checked={distinctOnly}
                              onCheckedChange={(checked) => updateSearchParams("dm", checked, true)}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      {/* Options section */}
                      <div>
                        <h3 className="text-sm font-medium mb-4 flex items-center gap-1.5">
                          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                          Display Options
                        </h3>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-base cursor-pointer" htmlFor="bucket-name">
                              Show bucket name in install command
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Include bucket name when copying installation commands
                            </p>
                          </div>
                          <Switch
                            id="bucket-name"
                            checked={showBucketName}
                            onCheckedChange={(checked) => updateSearchParams("n", checked, true)}
                          />
                        </div>
                      </div>
                      
                      <Separator />
                      
                      {/* Help section */}
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <div className="flex items-start gap-3">
                          <HelpCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <h4 className="font-medium mb-1">Search Tips</h4>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              <li>Use quotes for exact phrases: <code className="bg-muted px-1 py-0.5 rounded text-xs">"visual studio"</code></li>
                              <li>Include bucket name for specific searches: <code className="bg-muted px-1 py-0.5 rounded text-xs">extras/vscode</code></li>
                              <li>Search by description: <code className="bg-muted px-1 py-0.5 rounded text-xs">editor markdown</code></li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                  
                  <SheetFooter className="mt-4 sm:justify-between">
                    <SheetClose asChild>
                      <Button type="button" variant="outline" size="sm">
                        <X className="h-4 w-4 mr-2" />
                        Close
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button 
                        type="submit" 
                        size="sm"
                        onClick={handleSearch}
                      >
                        <Search className="h-4 w-4 mr-2" />
                        Search with Filters
                      </Button>
                    </SheetClose>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
              
              <Button 
                type="submit" 
                className="h-8"
              >
                Search
              </Button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Active filters display */}
      {(query || sortIndex !== 0 || !officialOnly || !distinctOnly) && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            
            {query && (
              <Badge variant="secondary" className="gap-1 px-2 py-1">
                Query: {query}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 -mr-1"
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString());
                    params.delete("q");
                    params.delete("p");
                    router.push(`/apps${params.toString() ? `?${params.toString()}` : ""}`);
                  }}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove query filter</span>
                </Button>
              </Badge>
            )}
            
            {sortIndex !== 0 && (
              <Badge variant="secondary" className="gap-1 px-2 py-1">
                Sort: {sortModes[sortIndex].name} ({sortDirection === 1 ? "Desc" : "Asc"})
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 -mr-1"
                  onClick={() => {
                    updateSearchParams("s", 0, 0);
                    updateSearchParams("d", 1, 1);
                  }}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Reset sort</span>
                </Button>
              </Badge>
            )}
            
            {!officialOnly && (
              <Badge variant="secondary" className="gap-1 px-2 py-1">
                Including community buckets
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 -mr-1"
                  onClick={() => updateSearchParams("o", true, true)}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Show official only</span>
                </Button>
              </Badge>
            )}
            
            {!distinctOnly && (
              <Badge variant="secondary" className="gap-1 px-2 py-1">
                Including duplicates
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 -mr-1"
                  onClick={() => updateSearchParams("dm", true, true)}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Show distinct only</span>
                </Button>
              </Badge>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-sm h-7"
              onClick={() => {
                router.push("/apps");
                setSearchInput("");
              }}
            >
              Clear all filters
            </Button>
          </div>
        </div>
      )}
      
      {/* Info boxes for different search states */}
      {isFirstLoad ? (
        <div className="py-12 text-center">
          <PackageOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-medium mb-2">Search for Scoop packages</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Enter a search term above to find packages from the Scoop ecosystem
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" asChild>
                    <Link href="/apps?q=git">
                      <Terminal className="mr-2 h-4 w-4" />
                      git
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Search for Git packages
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" asChild>
                    <Link href="/apps?q=vscode">
                      <Terminal className="mr-2 h-4 w-4" />
                      vscode
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Search for VS Code
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" asChild>
                    <Link href="/apps?q=python">
                      <Terminal className="mr-2 h-4 w-4" />
                      python
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Search for Python packages
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          {/* Popular Apps Section */}
          <div className="mt-16 text-left">
            <h2 className="text-xl font-medium mb-6 text-center">Popular Apps</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {popularApps.map((app) => (
                <Card key={app.name} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{app.name}</CardTitle>
                      {app.official ? (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          <span className="text-xs">Official</span>
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                          <Star className="mr-1 h-3 w-3" />
                          <span className="text-xs">Popular</span>
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="line-clamp-2 h-10">{app.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-sm mb-3">
                      <span className="font-medium">Source:</span> {app.bucket}
                    </div>
                    <Button size="sm" className="w-full" asChild>
                      <Link href={`/apps?q=${app.name}`}>
                        <Search className="mr-2 h-3.5 w-3.5" />
                        View Details
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      ) : !query && results.length === 0 ? (
        <div className="py-12 text-center">
          <Info className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-medium mb-2">Try searching for something</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Enter a package name, description, or bucket to begin searching
          </p>
        </div>
      ) : (
        <>
          {/* Results info bar */}
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-muted-foreground">Searching...</span>
                </div>
              ) : (
                <p className="text-sm">
                  {totalCount > 0 ? (
                    <>Found <span className="font-medium">{totalCount}</span> results{query ? ` for "${query}"` : ""}</>
                  ) : (
                    <>No results found{query ? ` for "${query}"` : ""}</>
                  )}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground mr-1 hidden sm:inline">Sort by:</span>
              <Tabs 
                value={sortIndex.toString()}
                onValueChange={(value) => toggleSort(parseInt(value, 10))}
                className="w-full sm:w-auto"
              >
                <TabsList className="grid grid-cols-3 h-8">
                  {sortModes.map((mode) => (
                    <TabsTrigger 
                      key={mode.id} 
                      value={mode.id.toString()}
                      className="text-xs px-2.5"
                    >
                      <mode.icon className="h-3.5 w-3.5 mr-1.5" />
                      {mode.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </div>
          
          {/* Search results */}
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
          
          {/* Pagination */}
          {totalCount > RESULTS_PER_PAGE && (
            <div className="flex justify-center">
              <Pagination
                currentPage={page}
                totalPages={Math.ceil(totalCount / RESULTS_PER_PAGE)}
              />
            </div>
          )}
        </>
      )}
      
      {/* Bottom CTA */}
      <div className="mt-12 border-t pt-12">
        <div className="bg-card text-card-foreground border rounded-xl p-6 flex flex-col md:flex-row items-center gap-6 justify-between">
          <div>
            <h3 className="text-xl font-semibold mb-2">Can't find what you're looking for?</h3>
            <p className="text-muted-foreground mb-0">
              You can easily create your own packages or browse all available buckets.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" asChild>
              <a 
                href="https://github.com/ScoopInstaller/Scoop/wiki/App-Manifests"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FileCode className="mr-2 h-4 w-4" />
                Create Packages
              </a>
            </Button>
            <Button asChild>
                              <Link href="/buckets">
                <Github className="mr-2 h-4 w-4" />
                Browse Buckets
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}