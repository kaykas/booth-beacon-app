import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/profile/',
          '/bookmarks/',
          '/my-collections/',
          '/_next/',  // Prevent indexing of static chunks
          '/test-references/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/profile/',
          '/bookmarks/',
          '/my-collections/',
          '/_next/',  // Prevent indexing of static chunks
          '/test-references/',
        ],
      },
    ],
    sitemap: 'https://boothbeacon.org/sitemap.xml',
  };
}
