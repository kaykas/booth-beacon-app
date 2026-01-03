import { Booth } from '@/types';

const HTTP_URL_PATTERN = /^https?:\/\//i;

function safeString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback;
}

function safeBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function safeNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function safeUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return HTTP_URL_PATTERN.test(trimmed) ? trimmed : undefined;
}

export type RenderableBooth = Booth & {
  locationLabel: string;
  addressDisplay: string;
  hasValidLocation: boolean;
};

const VALID_STATUSES: Booth['status'][] = ['active', 'unverified', 'inactive', 'closed'];

export function normalizeBooth(data: Partial<Booth> | null): RenderableBooth | null {
  if (!data) return null;

  const requiredId = safeString(data.id);
  const requiredSlug = safeString(data.slug);
  const requiredName = safeString(data.name);

  if (!requiredId || !requiredSlug || !requiredName) {
    return null;
  }

  const city = safeString(data.city, 'Location Unknown');
  const country = safeString(data.country);
  const address = safeString(data.address, 'Address not available');
  const state = safeString(data.state);
  const postalCode = safeString(data.postal_code);

  const latitude = safeNumber(data.latitude);
  const longitude = safeNumber(data.longitude);
  const hasValidLocation = latitude !== undefined && longitude !== undefined;

  // locationLabel: Use full address if available, otherwise fall back to city/country
  const locationLabel = address && address !== 'Address not available'
    ? `${address}${state && city !== state ? `, ${state}` : ''}${city ? `, ${city}` : ''}${country ? `, ${country}` : ''}`
    : `${city}${country ? `, ${country}` : ''}`;

  const addressDisplay = [address, postalCode, `${city}${state ? `, ${state}` : ''}${country ? `, ${country}` : ''}`]
    .filter(Boolean)
    .join(', ');

  const status = VALID_STATUSES.includes(data.status as Booth['status'])
    ? (data.status as Booth['status'])
    : 'unverified';

  return {
    ...data,
    id: requiredId,
    slug: requiredSlug,
    name: requiredName,
    address,
    city,
    country,
    state: state || undefined,
    postal_code: postalCode || undefined,
    latitude,
    longitude,
    status,
    is_operational: safeBoolean(data.is_operational, true),
    accepts_cash: safeBoolean(data.accepts_cash),
    accepts_card: safeBoolean(data.accepts_card),
    photo_exterior_url: safeUrl(data.photo_exterior_url),
    photo_interior_url: safeUrl(data.photo_interior_url),
    ai_preview_url: safeUrl(data.ai_preview_url),
    ai_generated_image_url: safeUrl(data.ai_generated_image_url),
    locationLabel,
    addressDisplay,
    hasValidLocation,
    created_at: safeString(data.created_at, new Date().toISOString()),
    updated_at: safeString(data.updated_at, new Date().toISOString()),
  } as RenderableBooth;
}
