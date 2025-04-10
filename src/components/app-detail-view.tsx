"use client";

import { useState } from 'react';
import Link from 'next/link';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { 
  Package, 
  ExternalLink, 
  Clock, 
  Bookmark, 
  FileJson, 
  FileCode, 
  Copy, 
  Check, 
  Star, 
  CheckCircle, 
  AlertCircle,
  FileText,
  ChevronRight,
  Download,
  Code,
  Command,
  RefreshCw,
  Shield
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CodeBlock } from '@/components/code-block';
import { formatRepositoryName } from '@/lib/app-utils';
import type { AppDetail } from '@/types/app';

// Initialize dayjs plugins
dayjs.extend(relativeTime);

type AppDetailViewProps = {
  app: AppDetail;
};

export function AppDetailView({ app }: AppDetailViewProps) {
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
  
  if (!app) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">App not found</p>
      </div>
    );
  }
  
  const getInstallCommand = () => {
    if (app.official) {
      return `scoop install ${app.name}`;
    }
    return `scoop bucket add ${app.repository} ${app.repositoryUrl} && scoop install ${app.name}`;
  };
  
  const formatBin = (bin: string | string[] | undefined) => {
    if (!bin) return null;
    
    if (typeof bin === 'string') {
      return [bin];
    }
    
    return bin;
  };
  
  const renderBadge = () => {
    if (app.official) {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800 flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          <span className="text-xs">Official</span>
        </Badge>
      );
    } else if (app.stars > 50) {
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800 flex items-center gap-1">
          <Star className="h-3 w-3" />
          <span className="text-xs">{app.stars}</span>
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-300 border-slate-200 dark:border-slate-800 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          <span className="text-xs">Community</span>
        </Badge>
      );
    }
  };
  
  const renderLinks = () => {
    // Format repository parts for navigation
    const repoParts = app.repositoryUrl.replace(/^https?:\/\//, '').split('/');
    const provider = repoParts[0] || 'github.com';
    const organization = repoParts[1] || '';
    const bucket = repoParts[2] || '';
    
    return (
      <div className="flex items-center gap-1 mb-4 text-sm">
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
        <Link href={`/apps/${provider}/${organization}/${bucket}`} className="text-primary hover:underline">
          {bucket}
        </Link>
      </div>
    );
  };

  const renderDependencies = () => {
    if (!app.dependencies || app.dependencies.length === 0) {
      return <p className="text-muted-foreground">No dependencies</p>;
    }

    if (typeof app.dependencies === 'string') {
      return <Badge variant="outline">{app.dependencies}</Badge>;
    }

    return (
      <div className="flex flex-wrap gap-2">
        {app.dependencies.map((dep, index) => (
          <Badge key={index} variant="outline">{dep}</Badge>
        ))}
      </div>
    );
  };
  
  const formattedBins = formatBin(app.bin);
  
  return (
    <div className="max-w-5xl mx-auto">
      {renderLinks()}
      
      <div className="bg-card rounded-xl border border-border shadow-sm p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold">{app.name}</h1>
              {renderBadge()}
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              from {formatRepositoryName(app.repositoryUrl)}
            </p>
            
            {app.description && (
              <p className="mb-6">{app.description}</p>
            )}
            
            <div className="flex flex-col gap-2 text-sm mb-6">
              {app.homepage && (
                <p className="flex items-center gap-1">
                  <ExternalLink className="h-4 w-4" title="Homepage" />
                  <a
                    href={app.homepage}
                    className="text-primary hover:underline truncate"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {app.homepage.replace(/^https?:\/\//, '')}
                  </a>
                </p>
              )}
              
              {app.license && (
                <p className="flex items-center gap-1">
                  <Bookmark className="h-4 w-4" title="License" />
                  <a
                    href={`https://spdx.org/licenses/${app.license}.html`}
                    className="hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {app.license}
                  </a>
                </p>
              )}
              
              <p className="flex items-center gap-1">
                <Clock className="h-4 w-4" title="Updated" />
                <a
                  href={`${app.repositoryUrl}/commit/${app.sha}`}
                  className="hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                  title={dayjs(app.committed).format('LLL')}
                >
                  {dayjs(app.committed).fromNow()}
                </a>
              </p>
              
              <p className="flex items-center gap-1">
                <Package className="h-4 w-4" title="Version" />
                <a
                  href={`${app.repositoryUrl}/blob/master/${encodeURIComponent(app.filePath.replace('#', '%23'))}`}
                  className="hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Manifest file"
                >
                  {app.version}
                </a>
              </p>
              
              {app.notes && (
                <p className="flex items-center gap-1">
                  <FileText className="h-4 w-4" title="Notes" />
                  <span>{app.notes}</span>
                </p>
              )}
            </div>
          </div>
          
          <div className="w-full md:w-80 space-y-4">
            <div className="bg-muted p-4 rounded-lg border border-border">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Download className="h-4 w-4" /> Installation
              </h3>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="text-muted-foreground">&gt;</span>
                </div>
                <Input
                  type="text"
                  readOnly
                  value={getInstallCommand()}
                  className="pl-8 pr-12 font-mono"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute inset-y-0 right-0 flex items-center px-3"
                  onClick={() => copyToClipboard(getInstallCommand(), 'install-cmd')}
                >
                  {copiedCommands['install-cmd'] ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              <div className="mt-4">
                <Button
                  variant="default"
                  size="sm"
                  className="w-full"
                  onClick={() => copyToClipboard(getInstallCommand(), 'install-btn')}
                >
                  {copiedCommands['install-btn'] ? (
                    <Check className="h-4 w-4 mr-2" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Install with Scoop
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="details">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="details">
            <FileText className="h-4 w-4 mr-2" />
            Details
          </TabsTrigger>
          <TabsTrigger value="commands">
            <Command className="h-4 w-4 mr-2" />
            Commands
          </TabsTrigger>
          <TabsTrigger value="updates">
            <RefreshCw className="h-4 w-4 mr-2" />
            Updates
          </TabsTrigger>
          <TabsTrigger value="manifest">
            <FileJson className="h-4 w-4 mr-2" />
            Manifest
          </TabsTrigger>
        </TabsList>
      
        <TabsContent value="details" className="p-4 border rounded-b-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Dependencies</h3>
              {renderDependencies()}
            </div>
            
            {app.architecture && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Architecture Support</h3>
                <div className="flex flex-col gap-2">
                  {app.architecture['64bit'] && (
                    <Badge variant="outline" className="flex items-center w-fit gap-1">
                      <Code className="h-3 w-3" />
                      <span>64-bit</span>
                    </Badge>
                  )}
                  {app.architecture['32bit'] && (
                    <Badge variant="outline" className="flex items-center w-fit gap-1">
                      <Code className="h-3 w-3" />
                      <span>32-bit</span>
                    </Badge>
                  )}
                </div>
              </div>
            )}
            
            {formattedBins && formattedBins.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Executables</h3>
                <div className="flex flex-wrap gap-2">
                  {formattedBins.map((bin, i) => (
                    <Badge key={i} variant="outline" className="flex items-center gap-1">
                      <Command className="h-3 w-3" />
                      <span>{bin}</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {app.shortcuts && app.shortcuts.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Shortcuts</h3>
                <div className="flex flex-col gap-2">
                  {app.shortcuts.map((shortcut, i) => (
                    <Badge key={i} variant="outline">
                      {shortcut[0]}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {app.installer && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Installer Configuration</h3>
                <div className="bg-muted p-3 rounded text-sm font-mono overflow-x-auto">
                  <pre>{JSON.stringify(app.installer, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="commands" className="p-4 border rounded-b-lg">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-3">Installation</h3>
              <CodeBlock
                language="powershell"
                code={getInstallCommand()}
              />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3">Update</h3>
              <CodeBlock
                language="powershell"
                code={`scoop update ${app.name}`}
              />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3">Uninstallation</h3>
              <CodeBlock
                language="powershell"
                code={`scoop uninstall ${app.name}`}
              />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3">Information</h3>
              <CodeBlock
                language="powershell"
                code={`scoop info ${app.name}`}
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="updates" className="p-4 border rounded-b-lg">
          <div className="grid grid-cols-1 gap-6">
            {app.checkver && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Version Check Configuration</h3>
                <div className="bg-muted p-4 rounded-lg">
                  {typeof app.checkver === 'string' ? (
                    <p className="font-mono text-sm">{app.checkver}</p>
                  ) : (
                    <pre className="font-mono text-sm">
                      {JSON.stringify(app.checkver, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            )}
            
            {app.autoupdate && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Auto-Update Configuration</h3>
                <div className="bg-muted p-4 rounded-lg">
                  <pre className="font-mono text-sm">
                    {JSON.stringify(app.autoupdate, null, 2)}
                  </pre>
                </div>
              </div>
            )}
            
            <div>
              <h3 className="text-lg font-semibold mb-3">Check for Updates</h3>
              <p className="mb-3">You can check if an update is available for this app by running:</p>
              <CodeBlock
                language="powershell"
                code={`scoop status ${app.name}`}
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="manifest" className="p-4 border rounded-b-lg">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Manifest JSON</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(app.content || '', 'manifest')}
              >
                {copiedCommands['manifest'] ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                Copy
              </Button>
            </div>
            
            {app.content ? (
              <div className="bg-muted border-border border rounded-lg">
                <CodeBlock
                  language="json"
                  code={app.content}
                />
              </div>
            ) : (
              <p className="text-muted-foreground">Manifest content not available</p>
            )}
            
            <div className="mt-4">
              <a
                href={`${app.repositoryUrl}/blob/master/${encodeURIComponent(app.filePath.replace('#', '%23'))}`}
                className="text-primary hover:underline flex items-center gap-1"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FileCode className="h-4 w-4" />
                View on GitHub
              </a>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}