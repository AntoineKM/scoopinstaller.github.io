import { Metadata } from "next";
import ProviderPageClient from './provider-client';
import { API_CONFIG } from '@/lib/api-config';

export const dynamic = 'force-static';

async function getAllProviders() {
  try {
    const fetchProvidersFromRepos = async (isOfficial: boolean) => {
      const response = await fetch(API_CONFIG.getSearchUrl(), {
        method: 'POST',
        headers: API_CONFIG.getSearchHeaders(),
        body: JSON.stringify({
          count: true,
          facets: ['Metadata/Repository,count:10000'],
          filter: `Metadata/OfficialRepositoryNumber eq ${isOfficial ? '1' : '0'}`,
          top: 0,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Provider request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      let facets = [];
      if (data.facets && data.facets['Metadata/Repository']) {
        facets = data.facets['Metadata/Repository'];
      } else if (data['@search.facets'] && data['@search.facets']['Metadata/Repository']) {
        facets = data['@search.facets']['Metadata/Repository'];
      } else {
        console.warn('Unexpected API response structure:', data);
        return [];
      }
      
      return facets || [];
    };
    
    const officialFacets = await fetchProvidersFromRepos(true);
    const communityFacets = await fetchProvidersFromRepos(false);
    const allFacets = [...officialFacets, ...communityFacets];
    
    const providers = new Set<string>();
    
    allFacets.forEach(item => {
      const repoUrl = item.value;
      if (!repoUrl) return;
      
      const urlMatch = repoUrl.match(/^https?:\/\/([^/]+)/);
      if (urlMatch && urlMatch[1]) {
        providers.add(urlMatch[1]);
      }
    });
    
    return Array.from(providers).sort();
  } catch (error) {
    console.error("Error fetching providers:", error);
    return ['github.com'];
  }
}

export async function generateStaticParams() {
  const providers = await getAllProviders();
  
  if (providers.length === 0) {
    return [{ provider: 'github.com' }];
  }
  
  return providers.map(provider => ({
    provider
  }));
}

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ provider: string }> 
}): Promise<Metadata> {
  const { provider } = await params;
  return {
    title: `Organizations on ${provider} | Scoop`,
    description: `Browse organizations hosting Scoop buckets on ${provider}`,
  };
}

export default async function ProviderPage({ 
  params 
}: { 
  params: Promise<{ provider: string }> 
}) {
  const { provider } = await params;
  return <ProviderPageClient initialProvider={provider} />;
}