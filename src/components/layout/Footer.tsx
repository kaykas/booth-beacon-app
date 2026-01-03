'use client';

import Link from 'next/link';
import { Instagram, Twitter, Mail } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer role="contentinfo" className="bg-background border-t border-primary/10 text-muted-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Column */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-glow">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <span className="font-display text-xl font-semibold text-foreground">
                Booth Beacon
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              The world&apos;s ultimate directory of analog photo booths. Find authentic photochemical machines worldwide.
            </p>
            <div className="flex gap-4">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-400 hover:text-primary transition"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-400 hover:text-primary transition"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="mailto:hello@boothbeacon.org"
                className="text-neutral-400 hover:text-primary transition"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Discover Column */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Discover</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/map" className="hover:text-primary transition">
                  Explore Map
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-primary transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/bookmarks" className="hover:text-primary transition">
                  My Bookmarks
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="https://photobooth.net" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition">
                  Photobooth.net
                </a>
              </li>
              <li>
                <a href="https://www.instagram.com/explore/tags/analogphotobooth/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition">
                  #AnalogPhotoBooth
                </a>
              </li>
              <li>
                <Link href="/admin" className="hover:text-primary transition">
                  Admin
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter Column */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Stay Updated</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get updates on new booths and features.
            </p>
            <form className="space-y-2">
              <input
                type="email"
                placeholder="your@email.com"
                className="w-full px-3 py-2 bg-card border border-primary/20 rounded text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                className="w-full px-3 py-2 btn-analog text-white rounded text-sm font-medium border-0"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-primary/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} Booth Beacon. Made with ♥ for analog photography.
          </p>
          <div className="flex gap-6 text-sm">
            <a href="mailto:hello@boothbeacon.org" className="text-muted-foreground hover:text-primary transition">
              Contact
            </a>
            <Link href="/admin" className="text-muted-foreground hover:text-primary transition">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
