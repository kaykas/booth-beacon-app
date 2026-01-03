'use client';

import Link from 'next/link';
import { Shield, CheckCircle2, Users, Database, Globe, Lock, FileText } from 'lucide-react';

export interface TrustSignalsProps {
  /**
   * Display variant: 'full' shows all trust signals, 'compact' shows minimal version
   * @default 'full'
   */
  variant?: 'full' | 'compact';

  /**
   * Optional custom booth count (defaults to 1200+)
   */
  boothCount?: number;

  /**
   * Optional custom data source count (defaults to 46)
   */
  sourceCount?: number;

  /**
   * Show as inline badges vs stacked layout
   * @default false
   */
  inline?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * TrustSignals Component
 *
 * Displays trust indicators and verification badges to build user confidence.
 * Used in footer and on important pages to establish credibility.
 *
 * Features:
 * - Data verification badge (1,200+ verified booths)
 * - Community-driven badge
 * - Privacy policy link
 * - Terms of service link
 * - User content disclaimer
 * - Data sources transparency
 * - Vintage styling matching site theme
 *
 * @example
 * // Full version in footer
 * <TrustSignals variant="full" />
 *
 * @example
 * // Compact inline version
 * <TrustSignals variant="compact" inline className="mt-4" />
 */
export function TrustSignals({
  variant = 'full',
  boothCount = 1200,
  sourceCount = 46,
  inline = false,
  className = ''
}: TrustSignalsProps) {
  if (variant === 'compact') {
    return (
      <div className={`text-xs text-muted-foreground ${inline ? 'flex items-center gap-3 flex-wrap' : 'space-y-2'} ${className}`}>
        <div className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-vintage-amber" />
          <span>{boothCount.toLocaleString()}+ Verified Booths</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-vintage-amber" />
          <span>Community-Driven</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-vintage-amber" />
          <Link href="/privacy" className="hover:text-primary transition-colors underline">
            Privacy
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Trust Badges */}
      <div className={`grid ${inline ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2'} gap-3`}>
        {/* Verified Data Badge */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-card to-card/50 border border-primary/10 rounded-lg p-3 hover:border-vintage-amber/30 transition-all duration-300">
          <div className="relative z-10 flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-vintage-amber to-vintage-orange flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold text-foreground group-hover:text-vintage-amber transition-colors">
                {boothCount.toLocaleString()}+
              </div>
              <div className="text-xs text-muted-foreground">
                Verified Booths
              </div>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-vintage-amber/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Community Badge */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-card to-card/50 border border-primary/10 rounded-lg p-3 hover:border-vintage-amber/30 transition-all duration-300">
          <div className="relative z-10 flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-vintage-amber to-vintage-orange flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground group-hover:text-vintage-amber transition-colors">
                Community
              </div>
              <div className="text-xs text-muted-foreground">
                User Contributions
              </div>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-vintage-amber/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Data Sources Badge */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-card to-card/50 border border-primary/10 rounded-lg p-3 hover:border-vintage-amber/30 transition-all duration-300">
          <div className="relative z-10 flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-vintage-amber to-vintage-orange flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold text-foreground group-hover:text-vintage-amber transition-colors">
                {sourceCount}
              </div>
              <div className="text-xs text-muted-foreground">
                Data Sources
              </div>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-vintage-amber/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* AI-Powered Badge */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-card to-card/50 border border-primary/10 rounded-lg p-3 hover:border-vintage-amber/30 transition-all duration-300">
          <div className="relative z-10 flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-vintage-amber to-vintage-orange flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground group-hover:text-vintage-amber transition-colors">
                Worldwide
              </div>
              <div className="text-xs text-muted-foreground">
                Coverage
              </div>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-vintage-amber/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      </div>

      {/* Disclaimer and Legal Links */}
      <div className="space-y-3 pt-2">
        {/* User Content Disclaimer */}
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <Shield className="w-4 h-4 flex-shrink-0 mt-0.5 text-vintage-amber/70" />
          <p className="leading-relaxed">
            Booth data is collected from multiple sources and verified by our community.
            While we strive for accuracy, booth availability and details may change.
            Always verify before visiting.
          </p>
        </div>

        {/* Privacy & Legal Links */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
          <Link
            href="/privacy"
            className="flex items-center gap-1.5 text-muted-foreground hover:text-vintage-amber transition-colors group"
          >
            <Lock className="w-3.5 h-3.5 group-hover:text-vintage-amber transition-colors" />
            <span className="underline decoration-muted-foreground/30 group-hover:decoration-vintage-amber">
              Privacy Policy
            </span>
          </Link>

          <Link
            href="/terms"
            className="flex items-center gap-1.5 text-muted-foreground hover:text-vintage-amber transition-colors group"
          >
            <FileText className="w-3.5 h-3.5 group-hover:text-vintage-amber transition-colors" />
            <span className="underline decoration-muted-foreground/30 group-hover:decoration-vintage-amber">
              Terms of Service
            </span>
          </Link>

          <Link
            href="/data-sources"
            className="flex items-center gap-1.5 text-muted-foreground hover:text-vintage-amber transition-colors group"
          >
            <Database className="w-3.5 h-3.5 group-hover:text-vintage-amber transition-colors" />
            <span className="underline decoration-muted-foreground/30 group-hover:decoration-vintage-amber">
              Data Sources
            </span>
          </Link>

          <a
            href="mailto:hello@boothbeacon.org"
            className="flex items-center gap-1.5 text-muted-foreground hover:text-vintage-amber transition-colors group"
          >
            <span className="underline decoration-muted-foreground/30 group-hover:decoration-vintage-amber">
              Report an Issue
            </span>
          </a>
        </div>

        {/* AI Extraction Notice */}
        <div className="text-xs text-muted-foreground/80 italic pt-1">
          Data enhanced with AI-powered extraction from web sources. Community contributions welcome.
        </div>
      </div>
    </div>
  );
}

/**
 * Compact inline trust badge for use in content areas
 */
export function TrustBadge({
  icon: Icon = CheckCircle2,
  label,
  className = ''
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  className?: string;
}) {
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-vintage-amber/10 border border-vintage-amber/20 text-xs font-medium text-foreground ${className}`}>
      <Icon className="w-3.5 h-3.5 text-vintage-amber" />
      <span>{label}</span>
    </div>
  );
}

/**
 * Data verification indicator for specific metrics
 */
export function VerifiedMetric({
  value,
  label,
  className = ''
}: {
  value: string | number;
  label: string;
  className?: string;
}) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <CheckCircle2 className="w-4 h-4 text-vintage-amber flex-shrink-0" />
      <span className="text-sm">
        <strong className="font-semibold text-foreground">{value}</strong>
        <span className="text-muted-foreground ml-1">{label}</span>
      </span>
    </div>
  );
}
