'use client';

import Link from 'next/link';
import { Search, Menu, Bookmark } from 'lucide-react';
import { useState } from 'react';
import { UserMenu } from '@/components/auth/UserMenu';
import { SearchBar } from '@/components/SearchBar';

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <header className="bg-card border-b border-primary/10 sticky top-0 z-50 backdrop-blur-sm bg-card/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-glow transition-all group-hover:shadow-glow-strong">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <span className="font-display text-xl font-semibold text-foreground">
                Booth Beacon
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/map"
              className="text-muted-foreground hover:text-primary transition font-medium"
            >
              Map
            </Link>
            <Link
              href="/collections"
              className="text-muted-foreground hover:text-primary transition font-medium"
            >
              Collections
            </Link>
            <Link
              href="/guides/berlin"
              className="text-muted-foreground hover:text-primary transition font-medium"
            >
              Guides
            </Link>
            <Link
              href="/about"
              className="text-muted-foreground hover:text-primary transition font-medium"
            >
              About
            </Link>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 text-muted-foreground hover:text-primary transition"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Bookmarks */}
            <Link
              href="/bookmarks"
              className="hidden sm:flex p-2 text-muted-foreground hover:text-primary transition"
              aria-label="Bookmarks"
            >
              <Bookmark className="w-5 h-5" />
            </Link>

            {/* User Menu */}
            <div className="hidden sm:flex">
              <UserMenu />
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-muted-foreground hover:text-primary transition"
              aria-label="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar (when open) */}
        {isSearchOpen && (
          <div className="pb-4">
            <SearchBar autoFocus />
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
              href="/collections"
              className="block px-4 py-2 text-neutral-700 hover:bg-neutral-50 rounded transition"
            >
              Collections
            </Link>
            <Link
              href="/about"
              className="block px-4 py-2 text-neutral-700 hover:bg-neutral-50 rounded transition"
            >
              About
            </Link>
            <hr className="my-2" />
            <Link
              href="/bookmarks"
              className="block px-4 py-2 text-neutral-700 hover:bg-neutral-50 rounded transition"
            >
              Bookmarks
            </Link>
            <div className="px-4 py-2">
              <UserMenu />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
