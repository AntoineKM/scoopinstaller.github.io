"use client";

import { useState } from "react";
import {
  ExternalLink,
  Package,
  Clock,
  FileText,
  Bookmark,
  Copy,
  Check,
  Star,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { 
  Card, 
  CardHeader, 
  CardContent
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

// Initialize dayjs plugins
dayjs.extend(relativeTime);

type SearchResultsProps = {
  results: any[];
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
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  
  if (results.length === 0 && query) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          No results found{query ? ` for '${query}'` : ""}.
          {officialOnly && (
            <span> Try modifying the filters to include community buckets.</span>
          )}
        </p>
      </div>
    );
  }
  
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">
        Found {totalCount} results{query ? ` for '${query}'` : ""}
      </p>
      
      <div className="space-y-4">
        {results.map((result) => (
          <Card key={result.id}>
            <CardHeader className="p-4 pb-0">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold" dangerouslySetInnerHTML={result.nameHighlighted} />
                  <span className="text-muted-foreground">in</span>
                  <a 
                    href={result.repositoryUrl}
                    className="text-primary hover:underline flex items-center gap-1"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span dangerouslySetInnerHTML={result.repositoryHighlighted} />
                    {result.official ? (
                      <CheckCircle className="h-4 w-4 text-blue-500" title="Official bucket" />
                    ) : result.stars > 50 ? (
                      <span className="flex items-center">
                        <Star className="h-4 w-4 text-amber-500" />
                        <span className="text-xs text-muted-foreground ml-1">{result.stars}</span>
                      </span>
                    ) : (
                      <AlertCircle className="h-4 w-4 text-muted-foreground" title="Community bucket" />
                    )}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" title="Updated" />
                    <a
                      href={`${result.repositoryUrl}/commit/${result.sha}`}
                      className="hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                      title={dayjs(result.committed).format('LLL')}
                    >
                      {dayjs(result.committed).fromNow()}
                    </a>
                  </div>
                  <span>|</span>
                  <div className="flex items-center gap-1">
                    <Package className="h-4 w-4" title="Version" />
                    <a
                      href={`${result.repositoryUrl}/blob/master/${encodeURIComponent(result.filePath.replace('#', '%23'))}`}
                      className="hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Manifest file"
                    >
                      <span dangerouslySetInnerHTML={result.versionHighlighted} />
                    </a>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  {result.description && (
                    <p dangerouslySetInnerHTML={result.descriptionHighlighted} />
                  )}
                  
                  <div className="flex flex-col gap-1 text-sm">
                    {result.homepage && (
                      <p className="flex items-center gap-1">
                        <ExternalLink className="h-4 w-4" title="Homepage" />
                        <a 
                          href={result.homepage}
                          className="text-primary hover:underline truncate"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {result.homepage.replace(/^https?:\/\//, '')}
                        </a>
                      </p>
                    )}
                    
                    {result.license && (
                      <p className="flex items-center gap-1">
                        <Bookmark className="h-4 w-4" title="License" />
                        <a 
                          href={`https://spdx.org/licenses/${result.license}.html`}
                          className="hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                          dangerouslySetInnerHTML={result.licenseHighlighted}
                        />
                      </p>
                    )}
                    
                    {result.notes && (
                      <p className="flex items-center gap-1">
                        <FileText className="h-4 w-4" title="Notes" />
                        <span>{result.notes}</span>
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  {!result.official && (
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-muted-foreground">&gt;</span>
                      </div>
                      <Input
                        type="text"
                        readOnly
                        value={`scoop bucket add ${result.repository} ${result.repositoryUrl}`}
                        className="pl-8 pr-12 font-mono"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute inset-y-0 right-0 flex items-center px-3"
                        onClick={() => copyToClipboard(`scoop bucket add ${result.repository} ${result.repositoryUrl}`, `bucket-${result.id}`)}
                      >
                        {copiedCommands[`bucket-${result.id}`] ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  )}
                  
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <span className="text-muted-foreground">&gt;</span>
                    </div>
                    <Input
                      type="text"
                      readOnly
                      value={`scoop install ${showBucketName ? result.repository + '/' : ''}${result.name}`}
                      className="pl-8 pr-12 font-mono font-bold"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute inset-y-0 right-0 flex items-center px-3"
                      onClick={() => copyToClipboard(`scoop install ${showBucketName ? result.repository + '/' : ''}${result.name}`, `install-${result.id}`)}
                    >
                      {copiedCommands[`install-${result.id}`] ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}