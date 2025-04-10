"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { AppDetailView } from '@/components/app-detail-view';
import { AppService } from '@/lib/app-service';
import type { AppDetail } from '@/types/app';

export default function AppDetailPage() {
  const params = useParams();
  const provider = params.provider as string;
  const organization = params.organization as string;
  const bucket = params.bucket as string;
  const appName = params.appName as string;
  
  const [app, setApp] = useState<AppDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchAppDetails = async () => {
      try {
        setLoading(true);
        const appData = await AppService.getAppDetails(
          provider,
          organization,
          bucket,
          appName
        );
        
        setApp(appData);
      } catch (err) {
        console.error("Error fetching app details:", err);
        setError("Failed to load app details");
      } finally {
        setLoading(false);
      }
    };
    
    fetchAppDetails();
  }, [provider, organization, bucket, appName]);
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 md:px-6">
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 md:px-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }
  
  if (!app) {
    return (
      <div className="container mx-auto px-4 py-8 md:px-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">App Not Found</h2>
          <p className="text-muted-foreground">
            The app "{appName}" could not be found in {organization}/{bucket}.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 md:px-6">
      <AppDetailView app={app} />
    </div>
  );
}