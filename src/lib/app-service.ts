import { API_CONFIG } from './api-config';
import type { AppDetail, AppSearchResult } from '@/types/app';

/**
 * Service for fetching app data from the API
 */
export const AppService = {
  /**
   * Get details for a specific app
   * @param provider The provider (e.g., github.com)
   * @param organization The organization (e.g., ScoopInstaller)
   * @param bucket The bucket name (e.g., Extras)
   * @param appName The app name (e.g., spotify)
   */
  getAppDetails: async (
    provider: string,
    organization: string,
    bucket: string,
    appName: string
  ): Promise<AppDetail | null> => {
    try {
      // Create repository URL from parts
      const repositoryUrl = `https://${provider}/${organization}/${bucket}`;
      
      // Search for apps in the specific repository
      const searchRequest = {
        count: true,
        // Use the app name as the search term but filter only by repository
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
      const exactMatch = data.value.find(item => item.Name === appName);
      
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
        repository: repository.split('/').pop().toLowerCase(),
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
          const [, , , org, repo] = repository.split('/');
          
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
      } catch (error) {
        console.error("Error fetching manifest:", error);
        // Return basic app info even if we can't get the manifest
      }
      
      return appInfo;
    } catch (error) {
      console.error("Error fetching app details:", error);
      throw error;
    }
  },
  
  /**
   * Search for apps
   * @param query Search query
   * @param filter Additional filters
   */
  searchApps: async (query: string, filter?: string): Promise<AppSearchResult[]> => {
    try {
      const filters = [];
      
      if (filter) {
        filters.push(filter);
      }
      
      const searchRequest = {
        count: true,
        search: query.trim(),
        searchMode: "all",
        filter: filters.join(' and '),
        top: 10,
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
        throw new Error(`Search request failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Process the results
      const results = (data.value || []).map(item => {
        const metadata = item.Metadata || {};
        const repository = metadata.Repository || '';
        const isOfficial = metadata.OfficialRepository || false;
        
        return {
          id: item.Id || '',
          name: item.Name || '',
          description: item.Description || '',
          version: item.Version || '',
          license: item.License || '',
          homepage: item.Homepage || '',
          repositoryUrl: repository,
          repository: repository.split('/').pop().toLowerCase(),
          official: isOfficial,
          stars: metadata.RepositoryStars || 0,
          committed: metadata.Committed || new Date().toISOString(),
          sha: metadata.Sha || '',
          filePath: metadata.FilePath || '',
          notes: item.Notes || '',
        };
      });
      
      return results;
    } catch (error) {
      console.error("Error searching apps:", error);
      return [];
    }
  },
};