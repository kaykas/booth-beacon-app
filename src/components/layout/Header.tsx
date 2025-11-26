'use client';

import Link from 'next/link';
import { Search, Menu, User, Bookmark } from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <span className="font-display text-xl font-semibold text-neutral-900">
                Booth Beacon
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/map"
              className="text-neutral-700 hover:text-primary transition font-medium"
            >
              Map
            </Link>
            <Link
              href="/guides/berlin"
              className="text-neutral-700 hover:text-primary transition font-medium"
            >
              Guides
            </Link>
            <Link
              href="/machines/photo-me-model-9"
              className="text-neutral-700 hover:text-primary transition font-medium"
            >
              Machines
            </Link>
            <Link
              href="/operators/classic-photo-booth"
              className="text-neutral-700 hover:text-primary transition font-medium"
            >
              Operators
            </Link>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 text-neutral-700 hover:text-primary transition"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Bookmarks */}
            <Link
              href="/bookmarks"
              className="hidden sm:flex p-2 text-neutral-700 hover:text-primary transition"
              aria-label="Bookmarks"
            >
              <Bookmark className="w-5 h-5" />
            </Link>

            {/* User */}
            <Link
              href="/profile"
              className="hidden sm:flex p-2 text-neutral-700 hover:text-primary transition"
              aria-label="Profile"
            >
              <User className="w-5 h-5" />
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-neutral-700 hover:text-primary transition"
              aria-label="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar (when open) */}
        {isSearchOpen && (
          <div className="pb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search booths, cities, or addresses..."
                className="w-full px-4 py-2 pl-10 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            </div>
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-200 bg-white">
          <nav className="px-4 py-4 space-y-3">
            <Link
              href="/map"
              className="block px-4 py-2 text-neutral-700 hover:bg-neutral-50 rounded transition"
            >
              Map
            </Link>
            <Link
              href="/guides/berlin"
              className="block px-4 py-2 text-neutral-700 hover:bg-neutral-50 rounded transition"
            >
              Guides
            </Link>
            <Link
              href="/machines/photo-me-model-9"
              className="block px-4 py-2 text-neutral-700 hover:bg-neutral-50 rounded transition"
            >
              Machines
            </Link>
            <Link
              href="/operators/classic-photo-booth"
              className="block px-4 py-2 text-neutral-700 hover:bg-neutral-50 rounded transition"
            >
              Operators
            </Link>
            <hr className="my-2" />
            <Link
              href="/bookmarks"
              className="block px-4 py-2 text-neutral-700 hover:bg-neutral-50 rounded transition"
            >
              Bookmarks
            </Link>
            <Link
              href="/profile"
              className="block px-4 py-2 text-neutral-700 hover:bg-neutral-50 rounded transition"
            >
              Profile
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
