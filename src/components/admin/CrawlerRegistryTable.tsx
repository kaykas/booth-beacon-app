'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Clock, Database, TrendingDown, Zap } from 'lucide-react';

interface RegistryRow {
  id: string;
  source_name: string;
  source_url: string;
  tier: string;
  cadence_days: number;
  last_run?: string;
  last_success?: string;
  error_rate?: number;
  last_result_count?: number;
  previous_result_count?: number;
  notes?: string;
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString();
}

function isStale(row: RegistryRow) {
  if (!row.last_run) return true;
  const cadenceMs = (row.cadence_days || 7) * 24 * 60 * 60 * 1000;
  return Date.now() - new Date(row.last_run).getTime() > cadenceMs;
}

function dropDetected(row: RegistryRow) {
  if (!row.previous_result_count) return false;
  return (row.last_result_count || 0) < row.previous_result_count * 0.8;
}

export function CrawlerRegistryTable() {
  const [rows, setRows] = useState<RegistryRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchRegistry() {
      setLoading(true);
      const { data, error } = await supabase
        .from('crawler_registry')
        .select('*')
        .eq('enabled', true)
        .order('tier', { ascending: true })
        .order('source_name', { ascending: true });

      if (!error && data) {
        setRows(data as RegistryRow[]);
      } else {
        console.error('Failed to load crawler registry', error?.message);
      }
      setLoading(false);
    }

    fetchRegistry();
  }, []);

  return (
    <Card className="p-6 bg-neutral-800 border-neutral-700">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-accent" />
            Crawler Registry
          </h2>
          <p className="text-sm text-neutral-400">
            Tracking high-priority NOT IN DATABASE sources from the Master Crawler Strategy.
          </p>
        </div>
        {loading ? (
          <Badge variant="secondary" className="bg-neutral-700 text-neutral-200">
            Loading…
          </Badge>
        ) : (
          <Badge variant="secondary" className="bg-neutral-700 text-neutral-200">
            {rows.length} sources
          </Badge>
        )}
      </div>

      <Table>
        <TableCaption className="text-neutral-400">
          High priority sources with cadence, last run, and health signals.
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="text-neutral-300">Source</TableHead>
            <TableHead className="text-neutral-300">Tier</TableHead>
            <TableHead className="text-neutral-300">Cadence</TableHead>
            <TableHead className="text-neutral-300">Last Run</TableHead>
            <TableHead className="text-neutral-300">Last Success</TableHead>
            <TableHead className="text-neutral-300">Counts</TableHead>
            <TableHead className="text-neutral-300">Alerts</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const stale = isStale(row);
            const drop = dropDetected(row);
            const hasErrors = (row.error_rate || 0) >= 25;
            const badges: JSX.Element[] = [];

            if (stale) {
              badges.push(
                <Badge key="stale" variant="secondary" className="bg-yellow-900 text-yellow-200 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Stale
                </Badge>
              );
            }

            if (drop) {
              badges.push(
                <Badge key="drop" variant="secondary" className="bg-orange-900 text-orange-200 flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" />
                  -20%
                </Badge>
              );
            }

            if (hasErrors) {
              badges.push(
                <Badge key="error" variant="secondary" className="bg-red-900 text-red-200 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Errors
                </Badge>
              );
            }

            return (
              <TableRow key={row.id} className="hover:bg-neutral-750/40">
                <TableCell className="text-white font-semibold">
                  <div className="flex flex-col">
                    <a
                      href={row.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline text-white"
                    >
                      {row.source_name}
                    </a>
                    {row.notes && <span className="text-xs text-neutral-400">{row.notes}</span>}
                  </div>
                </TableCell>
                <TableCell className="text-neutral-200">{row.tier}</TableCell>
                <TableCell className="text-neutral-200">Every {row.cadence_days} days</TableCell>
                <TableCell className="text-neutral-200">{formatDate(row.last_run)}</TableCell>
                <TableCell className="text-neutral-200">{formatDate(row.last_success)}</TableCell>
                <TableCell className="text-neutral-200">
                  <div className="flex flex-col text-sm text-neutral-200">
                    <span>
                      Last: <strong>{row.last_result_count ?? 0}</strong>
                    </span>
                    <span className="text-neutral-400 text-xs">
                      Prev: {row.previous_result_count ?? 0}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-neutral-200">
                  <div className="flex flex-wrap gap-2 items-center">
                    {badges.length === 0 && (
                      <Badge variant="secondary" className="bg-green-900 text-green-200 flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        Healthy
                      </Badge>
                    )}
                    {badges}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
