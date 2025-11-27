import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export const metadata = {
  title: 'Terms of Service | Booth Beacon',
  description: 'Terms of service for Booth Beacon - the world\'s analog photo booth directory.',
};

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-secondary via-white to-secondary">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <h1 className="font-display text-5xl font-semibold text-neutral-900 mb-8">
            Terms of Service
          </h1>

          <div className="card-vintage rounded-lg p-8 md:p-12 prose prose-lg max-w-none">
            <p className="text-neutral-600 mb-8">
              Last updated: November 2025
            </p>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold text-neutral-900 mb-4">
                Welcome to Booth Beacon
              </h2>
              <p className="text-neutral-700 leading-relaxed">
                These terms govern your use of Booth Beacon, the world&apos;s comprehensive analog photo booth
                directory. By using our service, you agree to these terms. We&apos;ve tried to keep them
                straightforward and fair.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold text-neutral-900 mb-4">
                Using Booth Beacon
              </h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                You can use Booth Beacon to:
              </p>
              <ul className="list-disc pl-6 space-y-3 text-neutral-700">
                <li>Discover and explore analog photo booths worldwide</li>
                <li>Save booths to your bookmarks for future visits</li>
                <li>Share photos, reviews, and tips with the community</li>
                <li>Submit new booth locations to help grow the directory</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold text-neutral-900 mb-4">
                Your Account
              </h2>
              <p className="text-neutral-700 leading-relaxed">
                You&apos;re responsible for keeping your account secure. Don&apos;t share your login credentials.
                If you suspect unauthorized access, let us know immediately. You must be at least 13
                years old to create an account.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold text-neutral-900 mb-4">
                Content You Submit
              </h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                When you submit photos, reviews, or booth information:
              </p>
              <ul className="list-disc pl-6 space-y-3 text-neutral-700">
                <li>You retain ownership of your content</li>
                <li>You grant us permission to display it on Booth Beacon</li>
                <li>You confirm you have the right to share it</li>
                <li>You agree not to submit anything illegal, harmful, or misleading</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold text-neutral-900 mb-4">
                Community Guidelines
              </h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                We&apos;re building a friendly community of photo booth enthusiasts. Please:
              </p>
              <ul className="list-disc pl-6 space-y-3 text-neutral-700">
                <li>Be respectful to other users</li>
                <li>Submit accurate information about booths</li>
                <li>Only upload photos you have permission to share</li>
                <li>Don&apos;t spam, harass, or impersonate others</li>
                <li>Report inaccurate or inappropriate content</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold text-neutral-900 mb-4">
                Booth Information Accuracy
              </h2>
              <p className="text-neutral-700 leading-relaxed">
                We do our best to keep booth information accurate, but we can&apos;t guarantee every detail
                is up-to-date. Booths may move, close, or change hours without notice. Always verify
                important details before making a special trip. We&apos;re not responsible for booths that
                aren&apos;t where we say they are.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold text-neutral-900 mb-4">
                Intellectual Property
              </h2>
              <p className="text-neutral-700 leading-relaxed">
                The Booth Beacon name, logo, and original content are our property. The booth data
                we&apos;ve compiled is also our property. You may not scrape, copy, or redistribute our
                database without permission.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold text-neutral-900 mb-4">
                Changes to These Terms
              </h2>
              <p className="text-neutral-700 leading-relaxed">
                We may update these terms occasionally. Significant changes will be communicated via
                email or a notice on the site. Continued use after changes means you accept the new terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold text-neutral-900 mb-4">
                Contact
              </h2>
              <p className="text-neutral-700 leading-relaxed">
                Questions? Reach out at{' '}
                <a href="mailto:hello@boothbeacon.org" className="text-primary hover:underline">
                  hello@boothbeacon.org
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
