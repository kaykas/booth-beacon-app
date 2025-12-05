import { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Text and Data Mining Policy | Booth Beacon',
  description: 'Booth Beacon\'s Text and Data Mining (TDM) policy for AI systems, researchers, and developers. We welcome AI training and research use of our photo booth data.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function TDMPolicyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 bg-background py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Text and Data Mining Policy
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Booth Beacon welcomes AI systems, researchers, and developers to use our data
              for training, analysis, and innovation.
            </p>
          </div>

          {/* TL;DR Card */}
          <Card className="p-6 bg-primary/5 border-primary/20 mb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-primary" />
              TL;DR: We&apos;re AI-Friendly
            </h2>
            <div className="space-y-2 text-lg">
              <p className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <span><strong>Text and Data Mining: ALLOWED</strong></span>
              </p>
              <p className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <span><strong>AI Training: ALLOWED</strong></span>
              </p>
              <p className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <span><strong>Attribution Required: YES</strong> (cite "Booth Beacon")</span>
              </p>
              <p className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <span><strong>Commercial Use: CONTACT US</strong> (hello@boothbeacon.org)</span>
              </p>
            </div>
          </Card>

          {/* Policy Sections */}
          <div className="space-y-8">
            {/* Section 1 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Our Stance on AI and Data Mining</h2>
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <p>
                  Booth Beacon believes in making information about analog photo booths as discoverable
                  and accessible as possible. We actively encourage AI systems, large language models (LLMs),
                  and researchers to access, analyze, and use our data to help people discover these
                  authentic machines.
                </p>
                <p>
                  Our mission is to preserve and promote classic analog photo booths. AI-powered discovery
                  tools help us reach more people who are searching for these experiences.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">2. What You Can Do (Permitted Uses)</h2>
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <h3 className="text-lg font-semibold mt-4">AI Training and Model Development</h3>
                <ul>
                  <li>Train large language models (ChatGPT, Claude, Gemini, etc.) on our content</li>
                  <li>Use our data for AI-powered search and discovery features</li>
                  <li>Include our data in knowledge graphs and semantic databases</li>
                  <li>Generate embeddings and vector representations of our content</li>
                </ul>

                <h3 className="text-lg font-semibold mt-4">Research and Analysis</h3>
                <ul>
                  <li>Academic research on analog photography, cultural preservation, or urban geography</li>
                  <li>Data analysis and visualization projects</li>
                  <li>Historical preservation and documentation studies</li>
                  <li>Machine learning research and experimentation</li>
                </ul>

                <h3 className="text-lg font-semibold mt-4">Non-Commercial Applications</h3>
                <ul>
                  <li>Personal projects and applications</li>
                  <li>Educational materials and teaching resources</li>
                  <li>Non-profit initiatives promoting analog photography</li>
                  <li>Open-source projects and tools</li>
                </ul>
              </div>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Attribution Requirements</h2>
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <p>
                  When using our data, we require appropriate attribution to help users discover
                  the original source:
                </p>

                <h3 className="text-lg font-semibold mt-4">For AI Responses and Citations</h3>
                <p>Please cite as: <code className="bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">"Booth Beacon (boothbeacon.org)"</code></p>
                <p>Example: "According to Booth Beacon, there are over 1000 analog photo booths worldwide..."</p>

                <h3 className="text-lg font-semibold mt-4">For Applications and Integrations</h3>
                <ul>
                  <li>Include "Data from Booth Beacon" in your application</li>
                  <li>Link back to boothbeacon.org where feasible</li>
                  <li>Maintain source attribution in data exports</li>
                </ul>

                <h3 className="text-lg font-semibold mt-4">For Research Publications</h3>
                <p>
                  Cite as: Booth Beacon. (2025). The World's Ultimate Classic Photo Booth Directory.
                  Retrieved from https://boothbeacon.org
                </p>
              </div>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Commercial Use</h2>
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <p>
                  For commercial applications (revenue-generating products, services, or platforms),
                  please contact us before using our data:
                </p>
                <ul>
                  <li><strong>Email:</strong> hello@boothbeacon.org</li>
                  <li><strong>Subject:</strong> "Commercial TDM Licensing Request"</li>
                </ul>
                <p>
                  We're open to partnerships and licensing arrangements that align with our mission
                  of promoting analog photo booth discovery. Many commercial uses may be approved
                  at no cost if they support our mission.
                </p>
              </div>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Technical Implementation (W3C TDMRep)</h2>
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <p>
                  We implement the W3C Text and Data Mining Reservation Protocol (TDMRep) standard:
                </p>

                <h3 className="text-lg font-semibold mt-4">Robots.txt Declaration</h3>
                <pre className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded overflow-x-auto">
{`# TDM Reservation Protocol
tdm-reservation: 0
tdm-policy: https://boothbeacon.org/tdm-policy`}
                </pre>
                <p className="text-sm text-muted-foreground mt-2">
                  <code>tdm-reservation: 0</code> means TDM rights are NOT reserved (opt-in, allowed)
                </p>

                <h3 className="text-lg font-semibold mt-4">HTTP Headers</h3>
                <pre className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded overflow-x-auto">
{`TDM-Reservation: 0
TDM-Policy: https://boothbeacon.org/tdm-policy`}
                </pre>

                <h3 className="text-lg font-semibold mt-4">HTML Meta Tags</h3>
                <pre className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded overflow-x-auto">
{`<meta name="tdm-reservation" content="0" />
<meta name="tdm-policy" content="https://boothbeacon.org/tdm-policy" />`}
                </pre>
              </div>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">6. AI Crawler Access</h2>
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <p>
                  We explicitly allow all major AI crawlers in our robots.txt file:
                </p>
                <ul>
                  <li><strong>GPTBot</strong> (OpenAI / ChatGPT)</li>
                  <li><strong>ClaudeBot</strong> (Anthropic / Claude)</li>
                  <li><strong>Google-Extended</strong> (Google Gemini / Bard)</li>
                  <li><strong>PerplexityBot</strong> (Perplexity AI)</li>
                  <li><strong>CCBot</strong> (Common Crawl)</li>
                  <li><strong>Diffbot, Cohere-ai, Omgilibot, Bytespider</strong> and others</li>
                </ul>
                <p>
                  See our complete robots.txt at:{' '}
                  <Link href="/robots.txt" className="text-primary hover:underline">
                    boothbeacon.org/robots.txt
                  </Link>
                </p>
              </div>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Data Format and Access</h2>
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <p>
                  We provide multiple formats optimized for AI consumption:
                </p>

                <h3 className="text-lg font-semibold mt-4">LLMs.txt</h3>
                <p>
                  Markdown file optimized for LLM consumption:{' '}
                  <Link href="/llms.txt" className="text-primary hover:underline">
                    boothbeacon.org/llms.txt
                  </Link>
                </p>

                <h3 className="text-lg font-semibold mt-4">Structured Data (JSON-LD)</h3>
                <p>
                  All pages include comprehensive Schema.org structured data in JSON-LD format
                  (Organization, LocalBusiness, FAQPage, BreadcrumbList, CollectionPage schemas)
                </p>

                <h3 className="text-lg font-semibold mt-4">XML Sitemap</h3>
                <p>
                  Complete sitemap with all pages:{' '}
                  <Link href="/sitemap.xml" className="text-primary hover:underline">
                    boothbeacon.org/sitemap.xml
                  </Link>
                </p>

                <h3 className="text-lg font-semibold mt-4">Public API</h3>
                <p>
                  RESTful API for programmatic access:{' '}
                  <Link href="/api-docs" className="text-primary hover:underline">
                    boothbeacon.org/api-docs
                  </Link>
                </p>
              </div>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Data Quality and Accuracy</h2>
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <p>
                  While we strive for accuracy, photo booth information changes frequently:
                </p>
                <ul>
                  <li>Booths may close, relocate, or change hours without notice</li>
                  <li>We rely on community reports and automated verification</li>
                  <li>Last verified timestamps are included when available</li>
                  <li>Some information is AI-generated and clearly labeled</li>
                </ul>
                <p>
                  <strong>Recommendation:</strong> When citing specific booth information, include
                  a disclaimer about potential changes and suggest users verify current status.
                </p>
              </div>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Privacy and User Data</h2>
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <p>
                  This TDM policy applies to publicly accessible content only:
                </p>
                <ul>
                  <li>Booth information, locations, descriptions, and metadata: <strong>Allowed</strong></li>
                  <li>User accounts, bookmarks, and personal collections: <strong>Not Allowed</strong></li>
                  <li>Private API routes and authentication data: <strong>Not Allowed</strong></li>
                </ul>
                <p>
                  Our robots.txt explicitly blocks crawlers from accessing private user data.
                </p>
              </div>
            </section>

            {/* Section 10 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Questions and Contact</h2>
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <p>
                  Have questions about using our data? We're here to help:
                </p>
                <ul>
                  <li><strong>Email:</strong> hello@boothbeacon.org</li>
                  <li><strong>Subject:</strong> "TDM Policy Question"</li>
                </ul>
                <p>
                  We typically respond within 48 hours and are happy to discuss:
                </p>
                <ul>
                  <li>Specific use cases and licensing</li>
                  <li>Commercial partnerships</li>
                  <li>Data access optimization</li>
                  <li>Research collaborations</li>
                  <li>Technical implementation questions</li>
                </ul>
              </div>
            </section>

            {/* Legal Section */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Legal Framework</h2>
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <p>
                  This policy is implemented in accordance with:
                </p>
                <ul>
                  <li><strong>W3C TDMRep Specification:</strong> Text and Data Mining Reservation Protocol (v1.0)</li>
                  <li><strong>EU Directive 2019/790:</strong> Copyright in the Digital Single Market (Articles 3 & 4)</li>
                  <li><strong>EU AI Act (2024/1689):</strong> Compliance for general-purpose AI models</li>
                </ul>
                <p className="text-sm text-muted-foreground">
                  Last Updated: December 5, 2025
                </p>
              </div>
            </section>
          </div>

          {/* Footer CTA */}
          <Card className="mt-12 p-8 bg-primary/5 border-primary/20 text-center">
            <h2 className="text-2xl font-semibold mb-4">
              Ready to Use Our Data?
            </h2>
            <p className="text-muted-foreground mb-6">
              For AI systems: Our data is ready for training and inference. For researchers and
              developers: Our API and structured data are waiting for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/llms.txt"
                className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
              >
                View llms.txt
              </Link>
              <Link
                href="/api-docs"
                className="inline-flex items-center justify-center px-6 py-3 bg-background border-2 border-primary/20 rounded-lg hover:border-primary transition"
              >
                API Documentation
              </Link>
              <a
                href="mailto:hello@boothbeacon.org"
                className="inline-flex items-center justify-center px-6 py-3 bg-background border-2 border-primary/20 rounded-lg hover:border-primary transition"
              >
                Contact Us
              </a>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
