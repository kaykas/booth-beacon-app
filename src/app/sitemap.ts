import { MetadataRoute } from 'next';
import { createPublicServerClient } from '@/lib/supabase';
import { getAllMachineModelSlugs } from '@/lib/machineData';

// Enable ISR (Incremental Static Regeneration) - regenerate every hour
export const revalidate = 3600;
export const dynamic = 'force-static';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://boothbeacon.org';
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
    {
      url: baseUrl + '/machines',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: baseUrl + '/recent',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: baseUrl + '/browse/all',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: baseUrl + '/collections/vintage-machines',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: baseUrl + '/collections/recently-verified',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: baseUrl + '/collections/popular-cities',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  const tourCities = ['berlin', 'new-york', 'london', 'san-francisco'];
  const tourPages: MetadataRoute.Sitemap = tourCities.map((city) => ({
    url: baseUrl + '/tours/' + city,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // Fetch published city guides from database
  let guidePages: MetadataRoute.Sitemap = [];
  try {
    const { data: guides, error } = await supabase
      .from('city_guides')
      .select('slug, updated_at')
      .eq('published', true);

    if (!error && guides) {
      guidePages = [
        // Main guides index page
        {
          url: baseUrl + '/guides',
          lastModified: new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        },
        // Individual guide pages
        ...guides.map((guide) => ({
          url: baseUrl + '/guides/' + guide.slug,
          lastModified: guide.updated_at ? new Date(guide.updated_at) : new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        })),
      ];
    }
  } catch (error) {
    console.error('Error fetching guides for sitemap:', error);
  }

  // UUID regex pattern to filter out auto-generated slugs
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  let boothPages: MetadataRoute.Sitemap = [];
  try {
    const { data: booths, error } = await supabase
      .from('booths')
      .select('slug, updated_at, status, name, city, latitude, longitude, data_source_type')
      .eq('status', 'active')  // Only active booths (excludes closed, pending, etc.)
      .not('slug', 'is', null)
      .neq('name', 'N/A')  // Exclude invalid extractions
      .neq('name', '')
      .neq('data_source_type', 'invalid_extraction');  // Exclude invalid extraction attempts

    if (!error && booths) {
      // Filter out booths with UUID slugs or insufficient content
      const validBooths = booths.filter((booth) => {
        // Exclude UUID-based slugs
        if (uuidPattern.test(booth.slug)) return false;
        // Exclude booths without a valid name
        if (!booth.name || booth.name.trim().length < 3) return false;
        // Exclude booths without location data
        if (!booth.city && !booth.latitude) return false;
        return true;
      });

      // Calculate priorities based on recency (boost recently updated booths)
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      boothPages = validBooths.map((booth) => {
        const updatedAt = booth.updated_at ? new Date(booth.updated_at) : new Date('2025-01-01');
        const isRecent = updatedAt > oneWeekAgo;
        const isModerate = updatedAt > oneMonthAgo;

        return {
          url: baseUrl + '/booth/' + booth.slug,
          lastModified: booth.updated_at ? new Date(booth.updated_at) : new Date(),
          changeFrequency: (isRecent ? 'daily' : isModerate ? 'weekly' : 'monthly') as const,
          priority: isRecent ? 0.9 : isModerate ? 0.8 : 0.7, // Boost recent updates
        };
      });
    }
  } catch (error) {
    console.error('Error fetching booths for sitemap:', error);
  }

  let countryPages: MetadataRoute.Sitemap = [];
  let cityPages: MetadataRoute.Sitemap = [];
  try {
    const { data: locations, error } = await supabase
      .from('booths')
      .select('country, state, city')
      .eq('status', 'active')
      .not('country', 'is', null)
      .not('city', 'is', null);

    if (!error && locations) {
      // Generate country pages
      const uniqueCountries = [...new Set(locations.map((l) => l.country).filter(Boolean))];
      countryPages = uniqueCountries.map((country) => ({
        url: baseUrl + '/locations/' + country.toLowerCase().replace(/\s+/g, '-'),
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));

      // Generate city pages (top 100 cities by booth count for sitemap size)
      const cityCounts = locations.reduce((acc, loc) => {
        if (loc.city && loc.country) {
          const key = `${loc.country}|${loc.state || ''}|${loc.city}`;
          acc[key] = (acc[key] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const topCities = Object.entries(cityCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 100)
        .map(([key]) => key.split('|'));

      cityPages = topCities.map(([country, state, city]) => {
        const countrySlug = country.toLowerCase().replace(/\s+/g, '-');
        const stateSlug = state ? state.toLowerCase().replace(/\s+/g, '-') : null;
        const citySlug = city.toLowerCase().replace(/\s+/g, '-');

        const cityUrl = stateSlug
          ? `${baseUrl}/locations/${countrySlug}/${stateSlug}/${citySlug}`
          : `${baseUrl}/locations/${countrySlug}/${citySlug}`;

        return {
          url: cityUrl,
          lastModified: new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.6,
        };
      });
    }
  } catch (error) {
    console.error('Error fetching locations for sitemap:', error);
  }

  // Generate machine model pages
  const machineSlugs = getAllMachineModelSlugs();
  const machinePages: MetadataRoute.Sitemap = machineSlugs.map((slug) => ({
    url: baseUrl + '/machines/' + slug,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [
    ...staticPages,
    ...tourPages,
    ...guidePages,
    ...boothPages,
    ...countryPages,
    ...cityPages,
    ...machinePages,
  ];
}
