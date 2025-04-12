"use client";

import { useState } from "react";
import { Filter, X, HelpCircle, SortDesc, CheckCircle2, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/search/search-input";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { sortModes } from "@/app/apps/page";

import { ArrowDownAZ, CalendarDays, Search } from "lucide-react";

type SearchFormProps = {
  searchInput: string;
  setSearchInput: (input: string) => void;
  handleSearch: (e: React.FormEvent) => void;
  sortIndex: number;
  sortDirection: number;
  officialOnly: boolean;
  distinctOnly: boolean;
  showBucketName: boolean;
  updateSearchParams: (key: string, value: any, defaultValue: any) => void;
};

export function SearchForm({
  searchInput,
  setSearchInput,
  handleSearch,
  sortIndex,
  sortDirection,
  officialOnly,
  distinctOnly,
  showBucketName,
  updateSearchParams
}: SearchFormProps) {
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  
  // Get the appropriate icon components for the sort modes
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'sort-desc':
        return SortDesc;
      case 'arrow-down-a-z':
        return ArrowDownAZ;
      case 'calendar-days':
        return CalendarDays;
      default:
        return SortDesc;
    }
  };

  // Handle search submit from the SearchInput component
  const onSearchSubmit = (query: string) => {
    setSearchInput(query);
    // Create a mock event object to pass to the handleSearch function
    const mockEvent = {
      preventDefault: () => {}
    } as React.FormEvent;
    handleSearch(mockEvent);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="relative group">
        <SearchInput
          initialQuery={searchInput}
          placeholder="Search for applications (e.g., git, vscode, nodejs...)"
          className="shadow-sm"
          inputClassName="pr-24 py-6 text-base shadow-sm"
          onSearch={onSearchSubmit}
          autoFocus={false}
          inputHeight="h-12"
          textSize="text-base"
          buttonText="Search"
        />
        
        <div className="absolute right-[80px] top-1/2 -translate-y-1/2 z-10">
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
                      {sortModes.map((mode) => {
                        const IconComponent = getIconComponent(mode.icon);
                        return (
                          <Card 
                            key={mode.id} 
                            className={`cursor-pointer transition-colors ${sortIndex === mode.id ? 'border-primary' : ''}`}
                            onClick={() => {
                              if (mode.id === sortIndex) {
                                // Toggle direction if same sort
                                updateSearchParams("d", sortDirection === 1 ? 0 : 1, sortModes[sortIndex].defaultDirection);
                              } else {
                                // Set new sort with default direction
                                updateSearchParams("s", mode.id, 0);
                                // Use default direction for that sort mode
                                updateSearchParams("d", mode.defaultDirection, mode.defaultDirection);
                              }
                            }}
                          >
                            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                              <div className="flex items-center gap-2">
                                <IconComponent className="h-4 w-4 text-primary" />
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
                        );
                      })}
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
        </div>
      </div>
    </div>
  );
}