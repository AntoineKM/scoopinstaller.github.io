"use client";

import Link from "next/link";
import { FileCode, Github } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SearchBottomCTA() {
  return (
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
  );
}