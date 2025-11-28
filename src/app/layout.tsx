import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { Toaster } from "@/components/ui/sonner";

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
    default: "Booth Beacon - Find Analog Photo Booths Worldwide",
    template: "%s | Booth Beacon",
  },
  description: "Discover authentic analog photo booths around the world. The ultimate directory of vintage photochemical machines. Find classic photo booths near you, save favorites, and explore city guides.",
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
  ],
  authors: [{ name: 'Booth Beacon' }],
  creator: 'Booth Beacon',
  publisher: 'Booth Beacon',
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
  },
  alternates: {
    canonical: 'https://boothbeacon.org',
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to external domains for faster loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://tmgbmcbwfkvmylmfpkzy.supabase.co" />
        <link rel="dns-prefetch" href="https://maps.googleapis.com" />
      </head>
      <body
        className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
