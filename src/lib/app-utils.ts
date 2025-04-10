import type { AppSearchResult } from '@/types/app';

/**
 * Utilities for working with app data
 */

/**
 * Extract repository parts from a repository URL
 * @param repositoryUrl The full repository URL
 */
export function parseRepositoryUrl(repositoryUrl: string): {
  provider: string;
  organization: string;
  bucket: string;
} {
  // Default values
  const defaultResult = {
    provider: 'github.com',
    organization: 'ScoopInstaller',
    bucket: 'Main'
  };
  
  if (!repositoryUrl) {
    return defaultResult;
  }
  
  try {
    // Remove protocol if present
    const cleanUrl = repositoryUrl.replace(/^https?:\/\//, '');
    const parts = cleanUrl.split('/');
    
    if (parts.length < 3) {
      return defaultResult;
    }
    
    return {
      provider: parts[0],
      organization: parts[1],
      bucket: parts[2]
    };
  } catch (error) {
    console.error("Error parsing repository URL:", error);
    return defaultResult;
  }
}

/**
 * Generate the app detail page URL
 * @param app The app data
 */
export function getAppDetailUrl(app: AppSearchResult): string {
  if (!app || !app.repositoryUrl) {
    return '#';
  }
  
  const { provider, organization, bucket } = parseRepositoryUrl(app.repositoryUrl);
  
  return `/apps/${provider}/${organization}/${bucket}/${app.name}`;
}

/**
 * Format a repository URL for display
 * @param url The repository URL
 */
export function formatRepositoryName(url: string): string {
  if (!url) return '';
  
  const { organization, bucket } = parseRepositoryUrl(url);
  
  return `${organization}/${bucket}`;
}