"use client";

import { Info } from "lucide-react";

export function SearchEmpty() {
  return (
    <div className="py-12 text-center">
      <Info className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
      <h2 className="text-xl font-medium mb-2">Try searching for something</h2>
      <p className="text-muted-foreground max-w-md mx-auto">
        Enter a package name, description, or bucket to begin searching
      </p>
    </div>
  );
}