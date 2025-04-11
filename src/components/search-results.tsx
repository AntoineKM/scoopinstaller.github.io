"use client";

import { useState } from "react";
import Link from "next/link";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { 
  ExternalLink, 
  Package, 
  Clock, 
  FileText, 
  Bookmark, 
  Copy, 
  Check, 
  Star, 
  CheckCircle2, 
  AlertCircle,
  Terminal,
  ChevronRight,
  Download
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getAppDetailUrl } from "@/lib/app-utils";
import type { AppSearchResult } from "@/types/app";

// Initialize dayjs plugins
dayjs.extend(relativeTime);

type SearchResultsProps = {
  results: AppSearchResult[];
  loading: boolean;
  query: string;
  officialOnly: boolean;
  showBucketName: boolean;
  totalCount: number;
};

export function SearchResults({
  results,
  loading,
  query,
  officialOnly,
  showBucketName,
  totalCount,
}: SearchResultsProps) {
  const [copiedCommands, setCopiedCommands] = useState<Record<string, boolean>>({});
  
  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCommands({ ...copiedCommands, [id]: true });
      setTimeout(() => {
        setCopiedCommands((prev) => ({ ...prev, [id]: false }));
      }, 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };
  
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-12" />
                </div>
                <Skeleton className="h-5 w-32" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-full" />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }
  
  if (results.length === 0 && query) {
    return (
      <div className="py-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-medium mb-3">No results found</h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          No packages found matching "{query}".
          {officialOnly && (
            <span> Try searching across community buckets by adjusting the filters.</span>
          )}
        </p>
        <div className="flex flex-col gap-6 items-center">
          {officialOnly && (
            <Button 
              onClick={() => {
                // Create URL with o=false to include community buckets
                const url = new URL(window.location.href);
                url.searchParams.set('o', 'false');
                window.location.href = url.toString();
              }}
            >
              <AlertCircle className="mr-2 h-4 w-4" />
              Include Community Buckets
            </Button>
          )}
          
          <div className="mt-4 w-full max-w-2xl">
            <h3 className="text-center text-lg font-medium mb-4">You might be interested in:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {['git', 'nodejs', 'python', 'vscode', 'neovim', '7zip'].map(app => (
                <Button 
                  key={app} 
                  variant="outline" 
                  className="justify-start"
                  asChild
                >
                  <a href={`/apps?q=${app}`}>
                    <Package className="mr-2 h-4 w-4" />
                    {app}
                  </a>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {results.map((result) => (
        <ResultCard 
          key={result.id}
          result={result}
          showBucketName={showBucketName}
          copyToClipboard={copyToClipboard}
          copiedCommands={copiedCommands}
        />
      ))}
      
      {results.length === 0 && !query && (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            Start typing to search for packages
          </p>
        </div>
      )}
    </div>
  );
}

type ResultCardProps = {
  result: AppSearchResult;
  showBucketName: boolean;
  copyToClipboard: (text: string, id: string) => Promise<void>;
  copiedCommands: Record<string, boolean>;
};

function ResultCard({ result, showBucketName, copyToClipboard, copiedCommands }: ResultCardProps) {
  // Format version with v prefix if it starts with a number
  const formattedVersion = result.version && /^\d/.test(result.version) 
    ? `v${result.version}` 
    : result.version;
  
  // Generate install command
  const bucketAddCommand = `scoop bucket add ${result.repository} ${result.repositoryUrl}`;
  const installCommand = `scoop install ${showBucketName ? result.repository + '/' : ''}${result.name}`;
  const fullInstallCommand = result.official 
    ? installCommand 
    : `${bucketAddCommand} && ${installCommand}`;
  
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Link 
                href={getAppDetailUrl(result)} 
                className="text-xl font-semibold hover:underline"
                dangerouslySetInnerHTML={result.nameHighlighted} 
              />
              
              {/* Badge for official or community */}
              {result.official ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                        Official
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      From an official Scoop bucket
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : result.stars > 50 ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                        <Star className="mr-1 h-3.5 w-3.5" />
                        {result.stars}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      Popular community bucket with {result.stars} stars
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-300 border-slate-200 dark:border-slate-800">
                        <AlertCircle className="mr-1 h-3.5 w-3.5" />
                        Community
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      From a community bucket
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              <Badge variant="secondary" className="font-mono">
                {formattedVersion}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <span>in</span>
              <a 
                href={result.repositoryUrl}
                className="text-primary hover:underline flex items-center gap-1"
                target="_blank"
                rel="noopener noreferrer"
                dangerouslySetInnerHTML={result.repositoryHighlighted} 
              />
              
              <span className="mx-1">•</span>
              
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" title="Updated" />
                <a
                  href={`${result.repositoryUrl}/commit/${result.sha}`}
                  className="hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                  title={dayjs(result.committed).format('LLL')}
                >
                  {dayjs(result.committed).fromNow()}
                </a>
              </span>
              
              <span className="mx-1">•</span>
              
              <span className="flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5" title="Manifest" />
                <a
                  href={`${result.repositoryUrl}/blob/master/${encodeURIComponent(result.filePath.replace('#', '%23'))}`}
                  className="hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="View manifest file"
                >
                  manifest
                </a>
              </span>
            </div>
            
            {result.description && (
              <p className="mb-4" dangerouslySetInnerHTML={result.descriptionHighlighted} />
            )}
            
            <div className="flex flex-wrap gap-y-2 gap-x-4 text-sm">
              {result.homepage && (
                <a 
                  href={result.homepage}
                  className="text-primary hover:underline flex items-center gap-1.5"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span className="truncate max-w-xs">
                    {result.homepage.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                  </span>
                </a>
              )}
              
              {result.license && (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Bookmark className="h-3.5 w-3.5" />
                  <a 
                    href={`https://spdx.org/licenses/${result.license}.html`}
                    className="hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                    dangerouslySetInnerHTML={result.licenseHighlighted}
                  />
                </span>
              )}
              
              {result.notes && (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <FileText className="h-3.5 w-3.5" />
                  <span>{result.notes}</span>
                </span>
              )}
            </div>
          </div>
          
          <div className="w-full md:w-auto shrink-0 md:ml-4 space-y-3">
            <Link
              href={getAppDetailUrl(result)}
              className="flex items-center justify-center md:justify-end text-sm text-primary hover:underline mb-2"
            >
              View details
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Link>
            
            {!result.official && (
              <div className="relative mb-2">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground opacity-70">
                  <Terminal className="h-3.5 w-3.5 mr-1" />
                </div>
                <Input
                  type="text"
                  readOnly
                  value={bucketAddCommand}
                  className="pl-9 pr-10 text-sm font-mono h-10 bg-muted/50 border-dashed"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                  onClick={() => copyToClipboard(bucketAddCommand, `bucket-${result.id}`)}
                >
                  {copiedCommands[`bucket-${result.id}`] ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            )}
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground opacity-70">
                <Terminal className="h-3.5 w-3.5 mr-1" />
              </div>
              <Input
                type="text"
                readOnly
                value={result.official ? installCommand : fullInstallCommand}
                className="pl-9 pr-10 text-sm font-mono h-10 bg-primary/5 border-primary/20"
              />
              <Button
                size="sm"
                variant="ghost"
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                onClick={() => copyToClipboard(result.official ? installCommand : fullInstallCommand, `install-${result.id}`)}
              >
                {copiedCommands[`install-${result.id}`] ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
            
            <Button 
              size="sm" 
              className="w-full"
              onClick={() => copyToClipboard(result.official ? installCommand : fullInstallCommand, `install-btn-${result.id}`)}
            >
              {copiedCommands[`install-btn-${result.id}`] ? (
                <Check className="mr-2 h-4 w-4" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Install {result.name}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}