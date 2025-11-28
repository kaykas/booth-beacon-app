import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://boothbeacon.org';

  // Fetch all active booths
  const { data: booths } = await supabase
    .from('booths')
    .select('id, updated_at')
    .eq('status', 'active');

  // Fetch all published city guides
  const { data: guides } = await supabase
    .from('city_guides')
    .select('slug, updated_at')
    .eq('published', true);

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/map`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/guides`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/submit`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  // Booth pages
  const boothPages: MetadataRoute.Sitemap = (booths || []).map((booth) => ({
    url: `${baseUrl}/booth/${booth.id}`,
    lastModified: new Date(booth.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // City guide pages
  const guidePages: MetadataRoute.Sitemap = (guides || []).map((guide) => ({
    url: `${baseUrl}/guides/${guide.slug}`,
    lastModified: new Date(guide.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...boothPages, ...guidePages];
}
