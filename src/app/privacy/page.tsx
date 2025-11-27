import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export const metadata = {
  title: 'Privacy Policy | Booth Beacon',
  description: 'Privacy policy for Booth Beacon - the world\'s analog photo booth directory.',
};

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-secondary via-white to-secondary">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <h1 className="font-display text-5xl font-semibold text-neutral-900 mb-8">
            Privacy Policy
          </h1>

          <div className="card-vintage rounded-lg p-8 md:p-12 prose prose-lg max-w-none">
            <p className="text-neutral-600 mb-8">
              Last updated: November 2025
            </p>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold text-neutral-900 mb-4">
                Our Commitment to Your Privacy
              </h2>
              <p className="text-neutral-700 leading-relaxed">
                At Booth Beacon, we believe in transparency and simplicity—just like the photo booths we celebrate.
                This policy explains what information we collect, how we use it, and your rights regarding your data.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold text-neutral-900 mb-4">
                Information We Collect
              </h2>
              <ul className="list-disc pl-6 space-y-3 text-neutral-700">
                <li>
                  <strong>Account Information:</strong> When you create an account, we collect your email address
                  and any profile information you choose to provide.
                </li>
                <li>
                  <strong>Location Data:</strong> With your permission, we may access your location to show nearby
                  photo booths. This is never shared or stored on our servers.
                </li>
                <li>
                  <strong>User Content:</strong> Photos, reviews, and tips you submit to help the community.
                </li>
                <li>
                  <strong>Usage Data:</strong> Basic analytics to help us improve the site (pages visited, features used).
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold text-neutral-900 mb-4">
                How We Use Your Information
              </h2>
              <ul className="list-disc pl-6 space-y-3 text-neutral-700">
                <li>To provide and improve our photo booth directory service</li>
                <li>To enable community features like bookmarks, reviews, and photo sharing</li>
                <li>To send important updates about the service (you can opt out anytime)</li>
                <li>To help you discover photo booths near you</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold text-neutral-900 mb-4">
                What We Don&apos;t Do
              </h2>
              <ul className="list-disc pl-6 space-y-3 text-neutral-700">
                <li>We don&apos;t sell your personal information to third parties</li>
                <li>We don&apos;t track your precise location without your explicit consent</li>
                <li>We don&apos;t spam you with marketing emails</li>
                <li>We don&apos;t share your data with advertisers</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold text-neutral-900 mb-4">
                Your Rights
              </h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                You have the right to:
              </p>
              <ul className="list-disc pl-6 space-y-3 text-neutral-700">
                <li>Access your personal data</li>
                <li>Correct inaccurate information</li>
                <li>Delete your account and associated data</li>
                <li>Export your data</li>
                <li>Opt out of non-essential communications</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold text-neutral-900 mb-4">
                Cookies
              </h2>
              <p className="text-neutral-700 leading-relaxed">
                We use essential cookies to keep you logged in and remember your preferences.
                We use analytics cookies to understand how people use the site. You can disable
                cookies in your browser settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-semibold text-neutral-900 mb-4">
                Contact Us
              </h2>
              <p className="text-neutral-700 leading-relaxed">
                Questions about this policy? Reach out at{' '}
                <a href="mailto:privacy@boothbeacon.org" className="text-primary hover:underline">
                  privacy@boothbeacon.org
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
