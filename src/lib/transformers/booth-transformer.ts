
import { Booth } from '@/types';

/**
 * SafeBooth View Model
 * A strict subset of Booth where critical display fields are guaranteed non-null.
 * This prevents crashes in UI rendering (e.g. toLowerCase() on null).
 */
export interface SafeBooth extends Omit<Booth, 'city' | 'country' | 'name' | 'status'> {
  name: string;
  city: string;
  country: string;
  status: 'active' | 'unverified' | 'inactive' | 'closed';
  
  // Computed/Helper fields for UI
  locationString: string;
  machineDescription: string;
  hasCity: boolean; // Flag to know if city was actually present vs defaulted
}

/**
 * Transform a raw DB Booth into a SafeBooth View Model.
 * Handles all null coalescing and default values centrally.
 */
export function transformBooth(raw: Booth): SafeBooth {
  const name = raw.name || 'Photo Booth';
  const city = raw.city || 'Unknown City';
  const country = raw.country || 'Unknown Country';
  const hasCity = !!raw.city;

  // Ensure status is valid
  const validStatuses = ['active', 'unverified', 'inactive', 'closed'];
  const status = validStatuses.includes(raw.status) 
    ? (raw.status as SafeBooth['status']) 
    : 'unverified';

  // Computed location string
  const locationParts = [];
  if (raw.city) locationParts.push(raw.city);
  if (raw.country) locationParts.push(raw.country);
  const locationString = locationParts.join(', ') || 'Unknown Location';

  // Computed machine description
  const machineParts = [];
  if (raw.machine_model) machineParts.push(raw.machine_model);
  if (raw.booth_type) machineParts.push(raw.booth_type);
  const machineDescription = machineParts.length > 0 
    ? machineParts.join(' • ') 
    : 'Analog Photo Booth';

  return {
    ...raw,
    name,
    city,
    country,
    status,
    locationString,
    machineDescription,
    hasCity
  };
}
