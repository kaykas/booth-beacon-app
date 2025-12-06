import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/profile/', '/bookmarks/', '/my-collections/'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/admin/', '/api/', '/profile/', '/bookmarks/', '/my-collections/'],
      },
    ],
    sitemap: 'https://boothbeacon.com/sitemap.xml',
  };
}
