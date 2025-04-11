"use client";

import Link from "next/link";
import { Search, CheckCircle2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

export function PopularApps() {
  return (
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
  );
}