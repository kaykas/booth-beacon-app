import { MetadataRoute } from 'next';
import { createPublicServerClient } from '@/lib/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://boothbeacon.com';
  const supabase = createPublicServerClient();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: baseUrl + '/map',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: baseUrl + '/submit',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: baseUrl + '/about',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: baseUrl + '/browse',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: baseUrl + '/search',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: baseUrl + '/collections',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: baseUrl + '/locations',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  const tourCities = ['berlin', 'new-york', 'london', 'san-francisco'];
  const tourPages: MetadataRoute.Sitemap = tourCities.map((city) => ({
    url: baseUrl + '/tours/' + city,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  let boothPages: MetadataRoute.Sitemap = [];
  try {
    const { data: booths, error } = await supabase
      .from('booths')
      .select('slug, updated_at, status')
      .eq('status', 'active')
      .not('slug', 'is', null);

    if (!error && booths) {
      boothPages = booths.map((booth) => ({
        url: baseUrl + '/booth/' + booth.slug,
        lastModified: booth.updated_at ? new Date(booth.updated_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
    }
  } catch (error) {
    console.error('Error fetching booths for sitemap:', error);
  }

  let countryPages: MetadataRoute.Sitemap = [];
  try {
    const { data: countries, error } = await supabase
      .from('booths')
      .select('country')
      .eq('status', 'active')
      .not('country', 'is', null);

    if (!error && countries) {
      const uniqueCountries = [...new Set(countries.map((c) => c.country))];
      countryPages = uniqueCountries.map((country) => ({
        url: baseUrl + '/locations/' + encodeURIComponent(country),
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }));
    }
  } catch (error) {
    console.error('Error fetching countries for sitemap:', error);
  }

  return [
    ...staticPages,
    ...tourPages,
    ...boothPages,
    ...countryPages,
  ];
}
