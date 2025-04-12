"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme } from "next-themes";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// We need to dynamically import asciinema-player
// This ensures it only loads on the client side
type AsciinemaPlayerType = {
  create: (
    src: string, 
    container: HTMLElement, 
    options: Record<string, any>
  ) => {
    dispose: () => void;
  };
};

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
  const playerInstanceRef = useRef<{ dispose: () => void } | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    const loadPlayer = async () => {
      if (playerRef.current) {
        try {
          // Clean up the previous player instance if it exists
          if (playerInstanceRef.current) {
            playerInstanceRef.current.dispose();
            playerInstanceRef.current = null;
          }
          
          // Ensure the container is empty
          playerRef.current.innerHTML = "";
          
          const activeCast = casts.find(cast => cast.key === activeTab);
          
          if (activeCast) {
            try {
              // Dynamically import asciinema-player
              const AsciinemaPlayerModule = await import('asciinema-player');
              
              // Create player with proper options
              const options = {
                autoPlay: true,
                rows: 15,
                cols: 80,
                theme: theme === 'dark' ? 'asciinema-theme-dark' : 'asciinema-theme-light',
              };
              
              // Create the player
              playerInstanceRef.current = AsciinemaPlayerModule.create(
                activeCast.url,
                playerRef.current,
                options
              );
            } catch (error) {
              console.error("Failed to load asciinema-player:", error);
              
              // Fallback: Create a simple terminal-like display
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
        } catch (error) {
          console.error("Error initializing player:", error);
        }
      }
    };
    
    loadPlayer();
    
    // Cleanup function
    return () => {
      if (playerInstanceRef.current) {
        try {
          playerInstanceRef.current.dispose();
        } catch (error) {
          console.error("Error disposing player:", error);
        }
      }
    };
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
            <div 
              ref={playerRef} 
              className="border rounded border-border asciinema-player-container"
            />
          </TabsContent>
        ))}
      </Tabs>
      
      {!isClient && (
        <div className="flex justify-center items-center h-64 border rounded border-border">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      )}
    </div>
  );
}