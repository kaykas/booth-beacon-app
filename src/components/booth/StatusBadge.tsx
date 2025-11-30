'use client';

import { Booth } from '@/types';

interface StatusBadgeProps {
  status: Booth['status'];
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const statusConfig = {
    active: {
      label: 'Active',
      className: 'bg-green-500 text-white',
      icon: '●',
    },
    unverified: {
      label: 'Unverified',
      className: 'bg-amber-500 text-white',
      icon: '◐',
    },
    inactive: {
      label: 'Inactive',
      className: 'bg-gray-400 text-white',
      icon: '○',
    },
    closed: {
      label: 'Closed',
      className: 'bg-red-500 text-white',
      icon: '✕',
    },
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2',
  };

  const config = statusConfig[status] || statusConfig.unverified;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded font-medium ${config.className} ${sizeClasses[size]}`}
    >
      <span className="text-xs">{config.icon}</span>
      {config.label}
    </span>
  );
}
