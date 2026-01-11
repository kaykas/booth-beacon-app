import { MetadataRoute } from 'next';

// Standard disallowed paths for all crawlers
const disallowedPaths = [
  '/admin/',
  '/api/',
  '/profile/',
  '/bookmarks/',
  '/my-collections/',
  '/_next/',  // Prevent indexing of static chunks
  '/test-references/',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Default rule for all crawlers
      {
        userAgent: '*',
        allow: '/',
        disallow: disallowedPaths,
      },
      // Google with enhanced preview settings
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: disallowedPaths,
      },
      // OpenAI GPT Crawler - Allow full access for ChatGPT/GPT citations
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: disallowedPaths,
      },
      // ChatGPT User Agent - Allow for real-time browsing
      {
        userAgent: 'ChatGPT-User',
        allow: '/',
        disallow: disallowedPaths,
      },
      // Anthropic Claude Crawler - Allow for Claude citations
      {
        userAgent: 'anthropic-ai',
        allow: '/',
        disallow: disallowedPaths,
      },
      // Claude Web Browsing Agent
      {
        userAgent: 'Claude-Web',
        allow: '/',
        disallow: disallowedPaths,
      },
      // Perplexity AI Crawler - Allow for Perplexity citations
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: disallowedPaths,
      },
      // Common Crawl - Used by many AI training datasets
      {
        userAgent: 'CCBot',
        allow: '/',
        disallow: disallowedPaths,
      },
      // Google AI/Bard - Extended crawler for AI training
      {
        userAgent: 'Google-Extended',
        allow: '/',
        disallow: disallowedPaths,
      },
      // Cohere AI Crawler
      {
        userAgent: 'cohere-ai',
        allow: '/',
        disallow: disallowedPaths,
      },
      // Meta/Facebook AI Crawler
      {
        userAgent: 'FacebookBot',
        allow: '/',
        disallow: disallowedPaths,
      },
      // Apple AI Crawler (Applebot-Extended)
      {
        userAgent: 'Applebot-Extended',
        allow: '/',
        disallow: disallowedPaths,
      },
    ],
    sitemap: 'https://boothbeacon.org/sitemap.xml',
  };
}
