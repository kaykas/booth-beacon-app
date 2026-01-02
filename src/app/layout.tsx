import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { generateOrganizationSchema, injectStructuredData } from "@/lib/seo/structuredData";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
  preload: true,
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: true,
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL('https://boothbeacon.org'),
  title: {
    default: "Find Analog Photo Booths Near You - Directory & Map",
    template: "%s | Booth Beacon",
  },
  description: "Discover authentic analog photo booths worldwide. Search 1000+ vintage photochemical machines, explore interactive maps, save favorites, and find classic photo booths near you.",
  keywords: [
    'photo booth',
    'analog photo booth',
    'vintage photo booth',
    'photochemical booth',
    'photo booth finder',
    'photo booth map',
    'classic photo booth',
    'film photo booth',
    'instant photos',
    'photo booth directory',
    'photo booth locator',
    'retro photo booth',
    '35mm photo booth',
    'chemical photo booth',
    'photo booth near me',
  ],
  authors: [{ name: 'Booth Beacon' }],
  creator: 'Booth Beacon',
  publisher: 'Booth Beacon',
  category: 'Travel & Entertainment',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://boothbeacon.org',
    siteName: 'Booth Beacon',
    title: 'Booth Beacon - Find Analog Photo Booths Worldwide',
    description: 'Discover authentic analog photo booths around the world. The ultimate directory of vintage photochemical machines.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Booth Beacon - Analog Photo Booth Directory',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Booth Beacon - Find Analog Photo Booths Worldwide',
    description: 'Discover authentic analog photo booths around the world. The ultimate directory of vintage photochemical machines.',
    images: ['/og-image.png'],
    creator: '@boothbeacon',
    site: '@boothbeacon',
  },
  alternates: {
    canonical: 'https://boothbeacon.org',
  },
  verification: {
    google: 'your-google-verification-code',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema = generateOrganizationSchema();

  return (
    <html lang="en">
      <head>
        {/* Preconnect to external domains for faster loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://tmgbmcbwfkvmylmfpkzy.supabase.co" />
        <link rel="dns-prefetch" href="https://maps.googleapis.com" />

        {/* TDM Reservation Protocol (W3C Standard) - Opt-in for AI text and data mining */}
        <meta name="tdm-reservation" content="0" />
        <meta name="tdm-policy" content="https://boothbeacon.org/tdm-policy" />

        {/* Structured Data - Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: injectStructuredData(organizationSchema) }}
        />
      </head>
      <body
        className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <GoogleAnalytics />
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
