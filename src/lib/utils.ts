import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class values into a single className string
 * Uses clsx for conditional classes and twMerge to handle Tailwind conflicts
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extracts the repository/bucket name from a URL
 * @param url The repository URL
 * @param separator The separator to use in the output (default: '/')
 * @returns The extracted repository name
 */
export function extractPathFromUrl(url: string, separator = '/'): string {
  return url.split('/').slice(-2).join(separator);
}

/**
 * Formats a repository URL to a displayable name
 * @param url The repository URL
 * @param isOfficial Whether the repository is official
 * @param officialRepoMap Map of official repository URLs to their names
 * @returns The formatted repository name
 */
export function formatRepositoryName(
  url: string, 
  isOfficial: boolean, 
  officialRepoMap?: Record<string, string>
): string {
  if (isOfficial && officialRepoMap && officialRepoMap[url]) {
    return officialRepoMap[url];
  }
  
  return url.split('/').pop() || '';
}

/**
 * Safely parses a query parameter to a number
 * @param value The value to parse
 * @param defaultValue The default value to return if parsing fails
 * @returns The parsed number or the default value
 */
export function parseNumberParam(value: string | null, defaultValue: number): number {
  if (!value) return defaultValue;
  
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Safely parses a query parameter to a boolean
 * @param value The value to parse
 * @param defaultValue The default value to return if parsing fails
 * @returns The parsed boolean or the default value
 */
export function parseBooleanParam(value: string | null, defaultValue: boolean): boolean {
  if (value === null) return defaultValue;
  return value !== 'false';
}

/**
 * Debounces a function
 * @param func The function to debounce
 * @param wait The wait time in milliseconds
 * @returns The debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}