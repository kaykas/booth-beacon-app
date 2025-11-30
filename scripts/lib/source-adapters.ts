import { parse } from 'node:url';

export interface NormalizedBoothData {
  name: string;
  address: string;
  city: string;
  country: string;
  description?: string;
  status?: string;
  latitude?: number;
  longitude?: number;
  booth_type?: 'analog' | 'digital' | 'chemical' | 'instant';
}

export type SourceAdapter = (markdown: string, sourceUrl: string) => NormalizedBoothData[];

const analogKeywords = [
  'analog',
  'chemical',
  'film',
  'silver gelatin',
  'dip & dunk',
  'developer',
  'paper roll',
  'film booth',
  'vintage',
  'black and white',
  'bw'
];

const digitalKeywords = ['digital', 'dslr', 'instant print', 'color printer', 'touchscreen'];

function normalizeKey(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function inferBoothType(text: string | undefined): 'analog' | 'digital' | undefined {
  if (!text) return undefined;
  const lower = text.toLowerCase();
  if (analogKeywords.some((keyword) => lower.includes(keyword))) return 'analog';
  if (digitalKeywords.some((keyword) => lower.includes(keyword))) return 'digital';
  return undefined;
}

function dedupeBooths(booths: NormalizedBoothData[]): NormalizedBoothData[] {
  const seen = new Map<string, NormalizedBoothData>();
  for (const booth of booths) {
    const key = `${normalizeKey(booth.name)}|${normalizeKey(booth.city)}|${normalizeKey(booth.country)}`;
    if (!seen.has(key)) {
      seen.set(key, booth);
      continue;
    }

    const existing = seen.get(key)!;
    if (!existing.description && booth.description) existing.description = booth.description;
    if (!existing.booth_type && booth.booth_type) existing.booth_type = booth.booth_type;
  }
  return Array.from(seen.values());
}

function parseBulletLines(markdown: string): string[] {
  return markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^[-*•]/.test(line) || /\|/.test(line));
}

function normalizeCountry(city: string, fallback?: string): string {
  const normalizedCity = city.toLowerCase();
  if (['london', 'manchester', 'brighton'].includes(normalizedCity)) return 'United Kingdom';
  if (['barcelona', 'madrid', 'valencia'].includes(normalizedCity)) return 'Spain';
  if (['florence', 'firenze', 'rome'].includes(normalizedCity)) return 'Italy';
  if (['stockholm', 'malmö', 'gothenburg', 'goteborg'].includes(normalizedCity)) return 'Sweden';
  if (['sydney', 'melbourne', 'brisbane', 'perth'].includes(normalizedCity)) return 'Australia';
  if (['new york', 'philadelphia', 'san francisco', 'los angeles', 'portland', 'seattle'].includes(normalizedCity)) {
    return 'USA';
  }
  return fallback || 'Unknown';
}

function parseStructuredLines(
  lines: string[],
  opts: { fallbackCountry?: string; defaultName?: string; defaultStatus?: string }
): NormalizedBoothData[] {
  const booths: NormalizedBoothData[] = [];

  for (const rawLine of lines) {
    const line = rawLine.replace(/^[-*•]\s*/, '').replace(/\|/g, ' | ');
    const parts = line.split(/ - | – | — | \| /).map((part) => part.trim()).filter(Boolean);

    if (parts.length < 2) continue;

    const [maybeName, maybeAddress, maybeCity] = parts;
    const city = (maybeCity || maybeAddress || '').split(',')[0].trim();
    const country = normalizeCountry(city, opts.fallbackCountry);
    const boothName = maybeName || opts.defaultName || 'Photo Booth';
    const address = parts.slice(1).join(', ');
    const booth_type = inferBoothType(line) || inferBoothType(opts.defaultName);

    booths.push({
      name: boothName,
      address: address || city,
      city: city || maybeName || 'Unknown',
      country,
      description: line,
      status: opts.defaultStatus || 'active',
      booth_type
    });
  }

  return booths;
}

function adapterAutofoto(markdown: string): NormalizedBoothData[] {
  const lines = parseBulletLines(markdown);
  const booths = parseStructuredLines(lines, {
    fallbackCountry: 'United Kingdom',
    defaultName: 'Autofoto Booth',
    defaultStatus: 'active'
  }).map((booth) => ({ ...booth, country: normalizeCountry(booth.city, booth.country) }));
  return dedupeBooths(booths);
}

function adapterPhotomatica(markdown: string): NormalizedBoothData[] {
  const lines = parseBulletLines(markdown);
  const booths = parseStructuredLines(lines, {
    fallbackCountry: 'USA',
    defaultName: 'Photomatica Booth',
    defaultStatus: 'active'
  }).map((booth) => ({
    ...booth,
    booth_type: inferBoothType(booth.description || booth.name) || 'analog'
  }));
  return dedupeBooths(booths);
}

function adapterMetroAutophoto(markdown: string): NormalizedBoothData[] {
  const lines = parseBulletLines(markdown);
  const booths = parseStructuredLines(lines, {
    fallbackCountry: 'Australia',
    defaultName: 'Metro Autophoto Booth',
    defaultStatus: 'active'
  }).map((booth) => ({
    ...booth,
    booth_type: 'analog'
  }));
  return dedupeBooths(booths);
}

function adapterClassicPhotobooth(markdown: string): NormalizedBoothData[] {
  const lines = parseBulletLines(markdown);
  const booths = parseStructuredLines(lines, {
    fallbackCountry: 'USA',
    defaultName: 'Classic Photo Booth',
    defaultStatus: 'active'
  }).map((booth) => ({
    ...booth,
    booth_type: inferBoothType(booth.description) || 'analog'
  }));
  return dedupeBooths(booths);
}

export const sourceAdapters: Record<string, SourceAdapter> = {
  'autofoto.org': adapterAutofoto,
  'photomatica.com': adapterPhotomatica,
  'metroautophoto.com.au': adapterMetroAutophoto,
  'classicphotobooth.net': adapterClassicPhotobooth
};

export function getAdapterForUrl(sourceUrl: string): SourceAdapter | undefined {
  const { hostname } = parse(sourceUrl);
  if (!hostname) return undefined;
  const normalizedHost = hostname.replace(/^www\./, '');
  return sourceAdapters[normalizedHost];
}

export function normalizeBoothCollection(booths: NormalizedBoothData[]): NormalizedBoothData[] {
  return dedupeBooths(
    booths.map((booth) => ({
      ...booth,
      booth_type: booth.booth_type || inferBoothType(booth.description || booth.name) || 'analog'
    }))
  );
}
