"use client";

import Link from "next/link";
import { PackageOpen, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

export function SearchIntro() {
  return (
    <div className="py-16 text-center">
      <Badge variant="outline" className="mb-4 px-3 py-1 text-sm inline-flex items-center">
        <PackageOpen className="mr-1 h-3.5 w-3.5" />
        Scoop Package Explorer
      </Badge>
      <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-4">
        Find the Perfect Package
      </h2>
      <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
        Discover thousands of packages from the Scoop ecosystem to enhance your Windows experience
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
    </div>
  );
}