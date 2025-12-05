import { createPublicServerClient } from '@/lib/supabase';

export async function GET() {
  const baseUrl = 'https://boothbeacon.org';
  const supabase = createPublicServerClient();

  // Fetch recent booths
  const { data: booths, error } = await supabase
    .from('booths')
    .select('id, name, slug, description, city, country, created_at, updated_at, photo_exterior_url, ai_generated_image_url')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error || !booths) {
    return new Response('Error generating RSS feed', { status: 500 });
  }

  const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Booth Beacon - Analog Photo Booth Directory</title>
    <link>${baseUrl}</link>
    <description>Discover authentic analog photo booths worldwide. The ultimate directory of vintage photochemical machines.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${baseUrl}/logo.png</url>
      <title>Booth Beacon</title>
      <link>${baseUrl}</link>
    </image>
    ${booths
      .map((booth) => {
        const location = [booth.city, booth.country].filter(Boolean).join(', ');
        const description = booth.description || `Analog photo booth in ${location}`;
        const image = booth.photo_exterior_url || booth.ai_generated_image_url;

        return `
    <item>
      <title>${escapeXml(booth.name)} - ${escapeXml(location)}</title>
      <link>${baseUrl}/booth/${booth.slug}</link>
      <guid>${baseUrl}/booth/${booth.slug}</guid>
      <description>${escapeXml(description)}</description>
      <pubDate>${new Date(booth.created_at).toUTCString()}</pubDate>
      ${image ? `<enclosure url="${escapeXml(image)}" type="image/jpeg" />` : ''}
      <category>Photo Booth</category>
      <category>${escapeXml(booth.country || 'Unknown')}</category>
      ${booth.city ? `<category>${escapeXml(booth.city)}</category>` : ''}
    </item>`;
      })
      .join('')}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
