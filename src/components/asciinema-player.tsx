"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme } from "next-themes";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// We'll need to install the asciinema-player package
// This is a simplified version that would need the actual player integration

type Cast = {
  key: string;
  displayName: string;
  url: string;
};

type AsciinemaPlayerProps = {
  casts: Cast[];
};

export function AsciinemaPlayer({ casts }: AsciinemaPlayerProps) {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState(casts[0].key);
  const playerRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    // This is where we would initialize the actual asciinema player
    // For now, we'll just simulate it with a placeholder
    
    const loadPlayer = async () => {
      if (playerRef.current) {
        playerRef.current.innerHTML = ""; // Clear previous player
        
        // Create a placeholder for the terminal display
        const activeCast = casts.find(cast => cast.key === activeTab);
        if (activeCast) {
          const terminal = document.createElement("div");
          terminal.className = "bg-muted border border-border rounded p-4 h-64 font-mono text-sm overflow-hidden";
          terminal.innerHTML = `<div class="flex items-center">
            <span class="text-green-500">$</span>
            <span class="ml-2">scoop install ${activeCast.displayName.toLowerCase()}</span>
          </div>
          <div class="mt-2">
            <span>Installing '${activeCast.displayName}' [64bit]...</span>
          </div>
          <div class="mt-2">
            <div class="w-full bg-background rounded-full h-2">
              <div class="bg-primary h-2 rounded-full" style="width: 100%"></div>
            </div>
          </div>
          <div class="mt-2">
            <span class="text-green-500">'${activeCast.displayName}' was installed successfully!</span>
          </div>`;
          
          playerRef.current.appendChild(terminal);
        }
      }
    };
    
    loadPlayer();
  }, [activeTab, casts, isClient, theme]);

  return (
    <div className="w-full">
      <Tabs defaultValue={casts[0].key} value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-2 md:grid-cols-4">
          {casts.map((cast) => (
            <TabsTrigger key={cast.key} value={cast.key}>
              {cast.displayName}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {casts.map((cast) => (
          <TabsContent key={cast.key} value={cast.key}>
            <div ref={playerRef} className="border rounded border-border" />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}