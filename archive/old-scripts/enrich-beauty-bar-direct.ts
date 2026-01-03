import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY_BACKEND || '';

interface PlaceDetails {
  place_id: string;
  name: string;
  formatted_address?: string;
  formatted_phone_number?: string;
  website?: string;
  opening_hours?: {
    weekday_text?: string[];
  };
  photos?: Array<{
    photo_reference: string;
  }>;
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

async function searchGooglePlaces(query: string): Promise<any[]> {
  const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
  url.searchParams.append('query', query);
  url.searchParams.append('key', GOOGLE_MAPS_API_KEY);

  const response = await fetch(url.toString());
  const data = await response.json();

  if (data.status === 'OK' && data.results) {
    return data.results;
  }

  return [];
}

async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  url.searchParams.append('place_id', placeId);
  url.searchParams.append('fields', 'place_id,name,formatted_address,formatted_phone_number,website,opening_hours,photos,geometry');
  url.searchParams.append('key', GOOGLE_MAPS_API_KEY);

  const response = await fetch(url.toString());
  const data = await response.json();

  if (data.status === 'OK' && data.result) {
    return data.result;
  }

  return null;
}

function getPhotoUrl(photoReference: string): string {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photo_reference=${photoReference}&key=${GOOGLE_MAPS_API_KEY}`;
}

async function enrichBeautyBar() {
  console.log('Searching for Beauty Bar San Francisco...');

  // Search for the venue
  const query = 'Beauty Bar San Francisco California';
  const results = await searchGooglePlaces(query);

  if (results.length === 0) {
    console.error('No results found');
    return;
  }

  console.log(`Found ${results.length} results`);
  console.log('Top result:', results[0].name);

  // Get detailed information
  const placeId = results[0].place_id;
  const details = await getPlaceDetails(placeId);

  if (!details) {
    console.error('Failed to get place details');
    return;
  }

  console.log('\nPlace Details:');
  console.log('- Name:', details.name);
  console.log('- Address:', details.formatted_address);
  console.log('- Phone:', details.formatted_phone_number);
  console.log('- Website:', details.website);
  console.log('- Hours:', details.opening_hours?.weekday_text?.length || 0, 'entries');
  console.log('- Photos:', details.photos?.length || 0);
  console.log('- Coordinates:', details.geometry?.location);

  // Update the booth in database
  const updates: Record<string, any> = {};

  if (details.formatted_address && details.formatted_address !== 'undefined') {
    updates.address = details.formatted_address;
  }

  if (details.formatted_phone_number && details.formatted_phone_number !== 'undefined') {
    updates.phone = details.formatted_phone_number;
  }

  if (details.website && details.website !== 'undefined') {
    updates.website = details.website;
  }

  if (details.opening_hours?.weekday_text) {
    updates.hours = details.opening_hours.weekday_text.join('\n');
  }

  if (details.photos && details.photos.length > 0) {
    const photoUrl = getPhotoUrl(details.photos[0].photo_reference);
    updates.photo_exterior_url = photoUrl;
  }

  if (details.geometry?.location) {
    updates.latitude = details.geometry.location.lat;
    updates.longitude = details.geometry.location.lng;
  }

  // Note: google_place_id column doesn't exist yet - skip for now

  updates.updated_at = new Date().toISOString();

  console.log('\nUpdating booth with', Object.keys(updates).length, 'fields...');

  const { error } = await supabase
    .from('booths')
    .update(updates)
    .eq('slug', 'beauty-bar-san-francisco');

  if (error) {
    console.error('Database update failed:', error);
    return;
  }

  console.log('✅ Booth updated successfully!');

  // Check new quality score
  const { data: updatedBooth } = await supabase
    .from('booths')
    .select('completeness_score')
    .eq('slug', 'beauty-bar-san-francisco')
    .single();

  if (updatedBooth) {
    console.log('\nNew Quality Score:', updatedBooth.completeness_score || 'Not calculated yet');
  }
}

enrichBeautyBar().catch(console.error);
