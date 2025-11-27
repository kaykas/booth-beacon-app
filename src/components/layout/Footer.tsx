'use client';

import Link from 'next/link';
import { Instagram, Twitter, Mail } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-neutral-900 text-neutral-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Column */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <span className="font-display text-xl font-semibold text-white">
                Booth Beacon
              </span>
            </div>
            <p className="text-sm text-neutral-400 mb-4">
              Find your next four frames. The world&apos;s most comprehensive analog photo booth directory.
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
            <h3 className="font-semibold text-white mb-4">Discover</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/map" className="hover:text-primary transition">
                  Explore Map
                </Link>
              </li>
              <li>
                <Link href="/guides" className="hover:text-primary transition">
                  City Guides
                </Link>
              </li>
              <li>
                <Link href="/machines" className="hover:text-primary transition">
                  Machine Models
                </Link>
              </li>
              <li>
                <Link href="/operators" className="hover:text-primary transition">
                  Operators
                </Link>
              </li>
            </ul>
          </div>

          {/* Community Column */}
          <div>
            <h3 className="font-semibold text-white mb-4">Community</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/submit" className="hover:text-primary transition">
                  Submit a Booth
                </Link>
              </li>
              <li>
                <Link href="/bookmarks" className="hover:text-primary transition">
                  My Bookmarks
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-primary transition">
                  My Profile
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-primary transition">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter Column */}
          <div>
            <h3 className="font-semibold text-white mb-4">Stay Updated</h3>
            <p className="text-sm text-neutral-400 mb-4">
              Get monthly updates on new booths and city guides.
            </p>
            <form className="space-y-2">
              <input
                type="email"
                placeholder="your@email.com"
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                className="w-full px-3 py-2 bg-primary text-white rounded text-sm font-medium hover:bg-primary-dark transition"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-neutral-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-neutral-500">
            © {currentYear} Booth Beacon. Made with ♥ for analog photography.
          </p>
          <div className="flex gap-6 text-sm">
            <Link href="/privacy" className="text-neutral-500 hover:text-primary transition">
              Privacy
            </Link>
            <Link href="/terms" className="text-neutral-500 hover:text-primary transition">
              Terms
            </Link>
            <Link href="/contact" className="text-neutral-500 hover:text-primary transition">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
