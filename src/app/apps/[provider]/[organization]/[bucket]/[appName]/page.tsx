import { Metadata } from "next";
import { AppDetailView } from '@/components/app-detail-view';
import { API_CONFIG } from '@/lib/api-config';
import type { AppDetail } from '@/types/app';

type AppDetailPageProps = {
  params: Promise<{
    provider: string;
    organization: string;
    bucket: string;
    appName: string;
  }>;
};

// Enable static site generation for output: export compatibility
export const dynamic = 'force-static';

// This function generates the static paths at build time
export async function generateStaticParams() {
  try {
    // Get total count of apps
    const totalCount = await getAppCount();
    if (totalCount === 0) {
      return [];
    }

    // Fetch all apps in batches
    return await fetchAllAppsInBatches(totalCount);
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}

// Get the total count of apps
async function getAppCount() {
  try {
    const countResponse = await fetch(API_CONFIG.getSearchUrl(), {
      method: 'POST',
      headers: API_CONFIG.getSearchHeaders(),
      body: JSON.stringify({
        count: true,
        search: "",
        searchMode: "all",
        filter: "Metadata/OfficialRepositoryNumber eq 1 and Metadata/DuplicateOf eq null",
        top: 0, // Just get count, no results
      }),
    });

    if (!countResponse.ok) {
      console.error("Failed to fetch app count for static generation");
      return 0;
    }

    const countData = await countResponse.json();
    const totalCount = countData['@odata.count'] || 0;
    console.log(`Total apps to generate: ${totalCount}`);
    
    return totalCount;
  } catch (error) {
    console.error("Error fetching app count:", error);
    return 0;
  }
}

// Fetch all apps in batches
async function fetchAllAppsInBatches(totalCount: number) {
  // Batch size for API requests
  const BATCH_SIZE = 1000;
  
  // Calculate number of batches needed
  const batchCount = Math.ceil(totalCount / BATCH_SIZE);
  console.log(`Will fetch apps in ${batchCount} batches of ${BATCH_SIZE}`);

  // Collect all apps across batches
  let allPaths: Array<{
    provider: string;
    organization: string;
    bucket: string;
    appName: string;
  }> = [];
  
  // Process each batch
  for (let i = 0; i < batchCount; i++) {
    const skip = i * BATCH_SIZE;
    console.log(`Fetching batch ${i+1}/${batchCount}, skip=${skip}`);
    
    const batchPaths = await fetchAppBatch(skip, BATCH_SIZE);
    allPaths = [...allPaths, ...batchPaths];
  }

  console.log(`Total static paths generated: ${allPaths.length}`);
  return allPaths;
}

// Fetch a single batch of apps
async function fetchAppBatch(skip: number, batchSize: number) {
  try {
    const batchResponse = await fetch(API_CONFIG.getSearchUrl(), {
      method: 'POST',
      headers: API_CONFIG.getSearchHeaders(),
      body: JSON.stringify({
        count: false,
        search: "",
        searchMode: "all",
        filter: "Metadata/OfficialRepositoryNumber eq 1 and Metadata/DuplicateOf eq null",
        orderby: "search.score() desc, Metadata/OfficialRepositoryNumber desc, NameSortable asc",
        skip: skip,
        top: batchSize,
        select: "Id,Name,Metadata/Repository",
      }),
    });

    if (!batchResponse.ok) {
      console.error(`Failed to fetch batch at skip=${skip}`);
      return [];
    }

    const batchData = await batchResponse.json();
    
    if (!batchData.value || !Array.isArray(batchData.value)) {
      console.error(`Invalid data format in batch at skip=${skip}`);
      return [];
    }

    // Parse apps in this batch
    const batchPaths = batchData.value
      .map((app: any) => {
        const repoUrl = app.Metadata?.Repository || '';
        if (!repoUrl) return null;
        
        // Extract provider, organization, and bucket from repository URL
        const urlParts = repoUrl.replace(/^https?:\/\//, '').split('/');
        if (urlParts.length < 3) return null;
        
        return {
          provider: urlParts[0],
          organization: urlParts[1],
          bucket: urlParts[2],
          appName: app.Name,
        };
      })
      .filter((item): item is { 
        provider: string; 
        organization: string; 
        bucket: string; 
        appName: string;
      } => item !== null);

    console.log(`Batch at skip=${skip} generated ${batchPaths.length} paths`);
    return batchPaths;
  } catch (error) {
    console.error(`Error fetching batch at skip=${skip}:`, error);
    return [];
  }
}

// Generate metadata for SEO
export async function generateMetadata(
  { params }: AppDetailPageProps
): Promise<Metadata> {
  // Need to await params before destructuring
  const unwrappedParams = await params;
  const { provider, organization, bucket, appName } = unwrappedParams;
  
  try {
    // Try to get detailed app info for better metadata
    const appData = await getAppData(provider, organization, bucket, appName);
    
    return {
      title: `${appName} | ${organization}/${bucket} | Scoop`,
      description: appData?.description || 
        `Installation details and information for ${appName} in the ${organization}/${bucket} bucket.`,
      openGraph: {
        title: `${appName} - Scoop Package Manager`,
        description: appData?.description || 
          `Installation details and information for ${appName} in the ${organization}/${bucket} bucket.`,
        type: 'website',
      },
    };
  } catch (error) {
    // Fallback metadata if we can't get app data
    return {
      title: `${appName} | ${organization}/${bucket} | Scoop`,
      description: `Installation details and information for ${appName} in the ${organization}/${bucket} bucket.`,
    };
  }
}

// Fetch app data
async function getAppData(
  provider: string, 
  organization: string, 
  bucket: string, 
  appName: string
): Promise<AppDetail | null> {
  try {
    // Create repository URL from parts
    const repositoryUrl = `https://${provider}/${organization}/${bucket}`;
    
    // Search for apps in the specific repository
    const searchRequest = {
      count: true,
      search: appName,
      searchMode: "all",
      filter: `Metadata/Repository eq '${repositoryUrl}'`,
      top: 20, // Get more results to ensure we find the exact match
      select: [
        'Id',
        'Name',
        'Description',
        'Notes',
        'Homepage',
        'License',
        'Version',
        'Metadata/Repository',
        'Metadata/FilePath',
        'Metadata/OfficialRepository',
        'Metadata/RepositoryStars',
        'Metadata/Committed',
        'Metadata/Sha',
      ].join(','),
    };

    const response = await fetch(API_CONFIG.getSearchUrl(), {
      method: 'POST',
      headers: API_CONFIG.getSearchHeaders(),
      body: JSON.stringify(searchRequest),
    });

    if (!response.ok) {
      throw new Error(`App search request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.value || data.value.length === 0) {
      return null;
    }

    // Find the exact match by app name
    const exactMatch = data.value.find((item: any) => item.Name === appName);
    
    // If no exact match is found, return null
    if (!exactMatch) {
      return null;
    }

    // Process the app data
    const appData = exactMatch;
    const metadata = appData.Metadata || {};
    const repository = metadata.Repository || '';
    const isOfficial = metadata.OfficialRepository || false;
    
    // Create base app info
    const appInfo: AppDetail = {
      id: appData.Id || '',
      name: appData.Name || '',
      description: appData.Description || '',
      version: appData.Version || '',
      license: appData.License || '',
      homepage: appData.Homepage || '',
      repositoryUrl: repository,
      repository: repository.split('/').pop()?.toLowerCase() || '',
      official: isOfficial,
      stars: metadata.RepositoryStars || 0,
      committed: metadata.Committed || new Date().toISOString(),
      sha: metadata.Sha || '',
      filePath: metadata.FilePath || '',
      notes: appData.Notes || '',
    };

    // Fetch the manifest content
    try {
      const manifestPath = metadata.FilePath || '';
      if (manifestPath) {
        // Extract organization and repo from the repository URL
        const urlParts = repository.split('/');
        if (urlParts.length >= 5) {
          const org = urlParts[3];
          const repo = urlParts[4];
          
          // Use jsDelivr as a CORS proxy to fetch raw GitHub content
          // Format: https://cdn.jsdelivr.net/gh/user/repo@branch/file
          const cdnUrl = `https://cdn.jsdelivr.net/gh/${org}/${repo}@master/${manifestPath}`;
          
          const manifestResponse = await fetch(cdnUrl);
          
          if (manifestResponse.ok) {
            const manifestContent = await manifestResponse.json();
            
            // Enhance app info with manifest details
            return {
              ...appInfo,
              content: JSON.stringify(manifestContent, null, 2),
              dependencies: manifestContent.depends || manifestContent.dependencies,
              bin: manifestContent.bin,
              shortcuts: manifestContent.shortcuts,
              env_add_path: manifestContent.env_add_path,
              uninstaller: manifestContent.uninstaller,
              architecture: manifestContent.architecture,
              url: manifestContent.url,
              hash: manifestContent.hash,
              installer: manifestContent.installer,
              pre_install: manifestContent.pre_install,
              post_install: manifestContent.post_install,
              checkver: manifestContent.checkver,
              autoupdate: manifestContent.autoupdate,
            };
          }
        }
      }
    } catch (error) {
      console.error("Error fetching manifest:", error);
      // Return basic app info even if we can't get the manifest
    }
    
    return appInfo;
  } catch (error) {
    console.error("Error fetching app details:", error);
    return null;
  }
}

// The main page component - we'll fetch the app data at build time
export default async function AppDetailPage({ params }: AppDetailPageProps) {
  // Need to await params before destructuring
  const unwrappedParams = await params;
  const { provider, organization, bucket, appName } = unwrappedParams;
  
  // Fetch the app data
  const app = await getAppData(provider, organization, bucket, appName);
  
  // If app not found, show a not found message
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