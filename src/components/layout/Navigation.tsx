'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MapIcon, BookOpen, Wrench, Users, Home } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    href: '/',
    label: 'Home',
    icon: <Home className="w-5 h-5" />,
  },
  {
    href: '/map',
    label: 'Map',
    icon: <MapIcon className="w-5 h-5" />,
  },
  {
    href: '/guides/berlin',
    label: 'Guides',
    icon: <BookOpen className="w-5 h-5" />,
  },
  {
    href: '/machines/photo-me-model-9',
    label: 'Machines',
    icon: <Wrench className="w-5 h-5" />,
  },
  {
    href: '/operators/classic-photo-booth',
    label: 'Operators',
    icon: <Users className="w-5 h-5" />,
  },
];

interface NavigationProps {
  variant?: 'sidebar' | 'bottomBar';
}

export function Navigation({ variant = 'sidebar' }: NavigationProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  if (variant === 'bottomBar') {
    // Mobile bottom navigation bar
    return (
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 md:hidden z-50">
        <div className="grid grid-cols-5 h-16">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 transition ${
                isActive(item.href)
                  ? 'text-primary'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              {item.icon}
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    );
  }

  // Desktop sidebar navigation
  return (
    <nav className="hidden md:flex md:flex-col gap-2 p-4 bg-white border-r border-neutral-200 min-h-screen w-64">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
            isActive(item.href)
              ? 'bg-primary text-white'
              : 'text-neutral-700 hover:bg-neutral-50'
          }`}
        >
          {item.icon}
          <span className="font-medium">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
