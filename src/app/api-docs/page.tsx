import { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card } from '@/components/ui/card';
import { Code, Database, Zap, Shield, Terminal, BookOpen } from 'lucide-react';

export const metadata: Metadata = {
  title: 'API Documentation - Public API for AI Agents & Developers | Booth Beacon',
  description: 'Complete API documentation for Booth Beacon\'s public RESTful API. Access 1000+ analog photo booth locations programmatically. Optimized for AI agents, LLMs, and application developers.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function APIDocsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 bg-background py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Terminal className="w-4 h-4" />
              Public API - Open Access
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Booth Beacon Public API
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Access 1000+ analog photo booth locations programmatically.
              Optimized for AI agents, LLMs, researchers, and application developers.
            </p>
          </div>

          {/* Quick Start Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="p-6">
              <Database className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">RESTful API</h3>
              <p className="text-sm text-muted-foreground">
                Simple HTTP endpoints returning JSON data. No authentication required for public endpoints.
              </p>
            </Card>
            <Card className="p-6">
              <Zap className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Fast & Cached</h3>
              <p className="text-sm text-muted-foreground">
                Edge-cached responses with sub-100ms latency. Optimized for high-volume AI agent queries.
              </p>
            </Card>
            <Card className="p-6">
              <Shield className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Open & Free</h3>
              <p className="text-sm text-muted-foreground">
                1000 requests/hour per IP. No API keys needed. Commercial use requires attribution.
              </p>
            </Card>
          </div>

          {/* Base URL */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Base URL</h2>
            <Card className="p-4 bg-neutral-900 text-neutral-100">
              <code className="text-sm">https://boothbeacon.org/api</code>
            </Card>
          </section>

          {/* Endpoints */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Endpoints</h2>

            {/* Endpoint 1: Get Booths */}
            <Card className="mb-6 overflow-hidden">
              <div className="bg-primary/5 p-4 border-b border-primary/20">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded">GET</span>
                  <code className="text-sm font-mono">/api/booths</code>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-2">List All Booths</h3>
                <p className="text-muted-foreground mb-4">
                  Returns a paginated list of all active photo booths with complete metadata.
                </p>

                <h4 className="font-semibold mb-2">Query Parameters</h4>
                <div className="space-y-2 mb-4">
                  <div className="flex items-start gap-2">
                    <code className="bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded text-xs">limit</code>
                    <span className="text-sm text-muted-foreground">Number of results per page (default: 100, max: 500)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <code className="bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded text-xs">offset</code>
                    <span className="text-sm text-muted-foreground">Pagination offset (default: 0)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <code className="bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded text-xs">status</code>
                    <span className="text-sm text-muted-foreground">Filter by status: active, closed, temporarily_closed</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <code className="bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded text-xs">country</code>
                    <span className="text-sm text-muted-foreground">Filter by country (e.g., &quot;United States&quot;, &quot;Germany&quot;)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <code className="bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded text-xs">city</code>
                    <span className="text-sm text-muted-foreground">Filter by city name</span>
                  </div>
                </div>

                <h4 className="font-semibold mb-2">Example Request</h4>
                <Card className="p-4 bg-neutral-900 text-neutral-100 mb-4">
                  <code className="text-xs">
                    GET https://boothbeacon.org/api/booths?limit=10&status=active&country=Germany
                  </code>
                </Card>

                <h4 className="font-semibold mb-2">Example Response</h4>
                <Card className="p-4 bg-neutral-900 text-neutral-100 overflow-x-auto">
                  <pre className="text-xs">
{`{
  "booths": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Berlin Photo Booth",
      "slug": "berlin-photo-booth",
      "city": "Berlin",
      "country": "Germany",
      "latitude": 52.5200,
      "longitude": 13.4050,
      "status": "active",
      "is_operational": true,
      "machine_model": "Photoautomat",
      "cost": "€4",
      "description": "Classic Photoautomat in Kreuzberg...",
      "photo_exterior_url": "https://...",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-12-05T00:00:00Z"
    }
  ],
  "total": 1000,
  "limit": 10,
  "offset": 0
}`}
                  </pre>
                </Card>
              </div>
            </Card>

            {/* Endpoint 2: Get Booth by ID */}
            <Card className="mb-6 overflow-hidden">
              <div className="bg-primary/5 p-4 border-b border-primary/20">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded">GET</span>
                  <code className="text-sm font-mono">/api/booths/[id]</code>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-2">Get Specific Booth</h3>
                <p className="text-muted-foreground mb-4">
                  Returns complete details for a single photo booth by ID or slug.
                </p>

                <h4 className="font-semibold mb-2">Path Parameters</h4>
                <div className="space-y-2 mb-4">
                  <div className="flex items-start gap-2">
                    <code className="bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded text-xs">id</code>
                    <span className="text-sm text-muted-foreground">Booth UUID or slug</span>
                  </div>
                </div>

                <h4 className="font-semibold mb-2">Example Request</h4>
                <Card className="p-4 bg-neutral-900 text-neutral-100 mb-4">
                  <code className="text-xs">
                    GET https://boothbeacon.org/api/booths/berlin-photo-booth
                  </code>
                </Card>
              </div>
            </Card>

            {/* Endpoint 3: Similar Booths */}
            <Card className="mb-6 overflow-hidden">
              <div className="bg-primary/5 p-4 border-b border-primary/20">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded">GET</span>
                  <code className="text-sm font-mono">/api/booths/[id]/similar</code>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-2">Find Similar Booths</h3>
                <p className="text-muted-foreground mb-4">
                  Returns booths with the same machine model or operator.
                </p>

                <h4 className="font-semibold mb-2">Example Request</h4>
                <Card className="p-4 bg-neutral-900 text-neutral-100 mb-4">
                  <code className="text-xs">
                    GET https://boothbeacon.org/api/booths/123e4567-e89b-12d3-a456-426614174000/similar
                  </code>
                </Card>
              </div>
            </Card>

            {/* Endpoint 4: City Booths */}
            <Card className="mb-6 overflow-hidden">
              <div className="bg-primary/5 p-4 border-b border-primary/20">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded">GET</span>
                  <code className="text-sm font-mono">/api/maps/city/[city]</code>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-2">Get Booths by City</h3>
                <p className="text-muted-foreground mb-4">
                  Returns all booths in a specific city, optimized for map clustering.
                </p>

                <h4 className="font-semibold mb-2">Example Request</h4>
                <Card className="p-4 bg-neutral-900 text-neutral-100 mb-4">
                  <code className="text-xs">
                    GET https://boothbeacon.org/api/maps/city/berlin
                  </code>
                </Card>
              </div>
            </Card>
          </section>

          {/* Response Schema */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Booth Object Schema</h2>
            <Card className="p-6">
              <div className="space-y-3">
                <h3 className="font-semibold">Complete booth object with all available fields:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <code className="text-primary">id</code> <span className="text-muted-foreground">- UUID</span>
                  </div>
                  <div>
                    <code className="text-primary">name</code> <span className="text-muted-foreground">- Booth name</span>
                  </div>
                  <div>
                    <code className="text-primary">slug</code> <span className="text-muted-foreground">- URL-friendly identifier</span>
                  </div>
                  <div>
                    <code className="text-primary">status</code> <span className="text-muted-foreground">- active/closed/temporarily_closed</span>
                  </div>
                  <div>
                    <code className="text-primary">is_operational</code> <span className="text-muted-foreground">- boolean</span>
                  </div>
                  <div>
                    <code className="text-primary">city</code> <span className="text-muted-foreground">- City name</span>
                  </div>
                  <div>
                    <code className="text-primary">state</code> <span className="text-muted-foreground">- State/province</span>
                  </div>
                  <div>
                    <code className="text-primary">country</code> <span className="text-muted-foreground">- Country name</span>
                  </div>
                  <div>
                    <code className="text-primary">latitude</code> <span className="text-muted-foreground">- Decimal degrees</span>
                  </div>
                  <div>
                    <code className="text-primary">longitude</code> <span className="text-muted-foreground">- Decimal degrees</span>
                  </div>
                  <div>
                    <code className="text-primary">street_address</code> <span className="text-muted-foreground">- Full address</span>
                  </div>
                  <div>
                    <code className="text-primary">postal_code</code> <span className="text-muted-foreground">- Zip/postal code</span>
                  </div>
                  <div>
                    <code className="text-primary">machine_model</code> <span className="text-muted-foreground">- Photo-Me, Photoautomat, etc.</span>
                  </div>
                  <div>
                    <code className="text-primary">machine_manufacturer</code> <span className="text-muted-foreground">- Manufacturer name</span>
                  </div>
                  <div>
                    <code className="text-primary">operator_name</code> <span className="text-muted-foreground">- Operator company</span>
                  </div>
                  <div>
                    <code className="text-primary">cost</code> <span className="text-muted-foreground">- Price per session</span>
                  </div>
                  <div>
                    <code className="text-primary">hours</code> <span className="text-muted-foreground">- Operating hours</span>
                  </div>
                  <div>
                    <code className="text-primary">description</code> <span className="text-muted-foreground">- Booth description</span>
                  </div>
                  <div>
                    <code className="text-primary">photo_exterior_url</code> <span className="text-muted-foreground">- Image URL</span>
                  </div>
                  <div>
                    <code className="text-primary">google_rating</code> <span className="text-muted-foreground">- 1.0 to 5.0</span>
                  </div>
                  <div>
                    <code className="text-primary">created_at</code> <span className="text-muted-foreground">- ISO 8601 timestamp</span>
                  </div>
                  <div>
                    <code className="text-primary">updated_at</code> <span className="text-muted-foreground">- ISO 8601 timestamp</span>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          {/* Rate Limiting */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Rate Limiting</h2>
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Current Limits</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li><strong>1000 requests per hour</strong> per IP address</li>
                    <li><strong>No authentication required</strong> for public endpoints</li>
                    <li>Edge caching reduces actual API hits</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Rate Limit Headers</h3>
                  <div className="space-y-1 text-sm">
                    <code className="block bg-neutral-100 dark:bg-neutral-800 p-2 rounded">X-RateLimit-Limit: 1000</code>
                    <code className="block bg-neutral-100 dark:bg-neutral-800 p-2 rounded">X-RateLimit-Remaining: 950</code>
                    <code className="block bg-neutral-100 dark:bg-neutral-800 p-2 rounded">X-RateLimit-Reset: 1638360000</code>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Need Higher Limits?</h3>
                  <p className="text-muted-foreground">
                    Contact us at <a href="mailto:hello@boothbeacon.org" className="text-primary hover:underline">hello@boothbeacon.org</a> for commercial partnerships or higher rate limits.
                  </p>
                </div>
              </div>
            </Card>
          </section>

          {/* AI Agent Optimization */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Optimizations for AI Agents</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <BookOpen className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold mb-2">LLMs.txt Support</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Markdown-formatted index optimized for LLM consumption at <code className="bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">/llms.txt</code>
                </p>
                <Link href="/llms.txt" className="text-primary text-sm hover:underline">
                  View llms.txt →
                </Link>
              </Card>

              <Card className="p-6">
                <Code className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold mb-2">Structured Data</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  All pages include JSON-LD structured data (Schema.org) for entity extraction
                </p>
                <Link href="/#" className="text-primary text-sm hover:underline">
                  Schema Documentation →
                </Link>
              </Card>

              <Card className="p-6">
                <Database className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold mb-2">OpenAPI Spec</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  OpenAPI 3.0 specification for AI framework integrations (LangChain, etc.)
                </p>
                <code className="text-xs bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded block mt-2">
                  Coming soon
                </code>
              </Card>

              <Card className="p-6">
                <Zap className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold mb-2">GraphQL Support</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  GraphQL API with introspection for flexible AI agent queries
                </p>
                <code className="text-xs bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded block mt-2">
                  Coming soon
                </code>
              </Card>
            </div>
          </section>

          {/* Attribution */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Attribution & Licensing</h2>
            <Card className="p-6 bg-primary/5 border-primary/20">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Required Attribution</h3>
                  <p className="text-muted-foreground mb-2">
                    When using our API data, please provide attribution:
                  </p>
                  <code className="block bg-background p-3 rounded text-sm">
                    &quot;Data from Booth Beacon (boothbeacon.org)&quot;
                  </code>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Non-Commercial Use</h3>
                  <p className="text-muted-foreground">
                    Free for research, personal projects, AI training, and non-commercial applications.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Commercial Use</h3>
                  <p className="text-muted-foreground">
                    Contact us for commercial licensing. Many uses are approved at no cost.
                  </p>
                </div>
                <div>
                  <Link href="/tdm-policy" className="text-primary hover:underline">
                    Full TDM & Data Mining Policy →
                  </Link>
                </div>
              </div>
            </Card>
          </section>

          {/* Support */}
          <Card className="p-8 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 text-center">
            <h2 className="text-2xl font-semibold mb-4">Questions or Need Help?</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              We&apos;re here to help you integrate Booth Beacon data into your application.
              Whether you&apos;re building an AI agent, travel app, or research project, we&apos;d love to hear from you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:hello@boothbeacon.org"
                className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
              >
                Email Us
              </a>
              <Link
                href="/tdm-policy"
                className="inline-flex items-center justify-center px-6 py-3 bg-background border-2 border-primary/20 rounded-lg hover:border-primary transition"
              >
                View TDM Policy
              </Link>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
