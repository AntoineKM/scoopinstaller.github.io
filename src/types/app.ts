/**
 * Types for Scoop app data
 */

export type AppSearchResult = {
  id: string;
  name: string;
  nameHighlighted?: { __html: string };
  description?: string;
  descriptionHighlighted?: { __html: string };
  version: string;
  versionHighlighted?: { __html: string };
  license?: string;
  licenseHighlighted?: { __html: string };
  homepage?: string;
  repositoryUrl: string;
  repository: string;
  repositoryHighlighted?: { __html: string };
  official: boolean;
  stars: number;
  committed: string;
  sha: string;
  filePath: string;
  notes?: string;
};

export type AppDetail = AppSearchResult & {
  content?: string;
  dependencies?: string[];
  bin?: string | string[];
  shortcuts?: Array<[string, string, string?]>;
  env_add_path?: string | string[];
  uninstaller?: {
    script?: string;
  };
  architecture?: {
    '64bit'?: {
      url: string;
      hash: string;
    };
    '32bit'?: {
      url: string;
      hash: string;
    };
  };
  url?: string | string[];
  hash?: string | string[];
  installer?: any;
  pre_install?: string | string[];
  post_install?: string | string[];
  checkver?: string | {
    url?: string;
    regex?: string;
    jsonpath?: string;
    reverse?: boolean;
  };
  autoupdate?: {
    url?: string | string[];
    hash?: {
      url?: string;
      regex?: string;
      mode?: string;
    };
  };
  downloads?: {
    date: string;
    count: number;
  }[];
};