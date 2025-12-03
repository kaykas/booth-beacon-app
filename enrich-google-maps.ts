/**
 * GOOGLE MAPS ENRICHMENT SCRIPT
 *
 * Enriches booth data with:
 * - Hours of operation
 * - Phone numbers
 * - Websites
 * - Google ratings & review counts
 * - Google photos (up to 5 per booth)
 * - Business operational status
 *
 * Cost: ~$0.05 per booth (Place Details API + Photos)
 */

import { Client, PlaceInputType } from '@googlemaps/google-maps-services-js';
import { createClient } from '@supabase/supabase-js';

const googleMapsClient = new Client({});
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY!;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface BoothEnrichment {
  // Map to existing columns since Google-specific columns don't exist yet
  hours?: string;           // Using existing 'hours' column
  phone?: string;           // Using existing 'phone' column
  website?: string;         // Using existing 'website' column
  is_operational?: boolean; // Using existing 'is_operational' column
  photos?: string[];        // Using existing 'photos' column
  description?: string;     // Append Google rating info to description
}

/**
 * Find Place using Text Search
 */
async function findPlace(boothName: string, address: string, city: string, country: string) {
  try {
    const query = `${boothName} photobooth ${address} ${city} ${country}`;

    const response = await googleMapsClient.findPlaceFromText({
      params: {
        input: query,
        inputtype: PlaceInputType.textQuery,
        fields: ['place_id', 'name', 'formatted_address'],
        key: GOOGLE_MAPS_API_KEY
      }
    });

    if (response.data.candidates && response.data.candidates.length > 0) {
      return response.data.candidates[0].place_id;
    }

    // Fallback: Try just the address
    const addressQuery = `${address} ${city} ${country}`;
    const addressResponse = await googleMapsClient.findPlaceFromText({
      params: {
        input: addressQuery,
        inputtype: PlaceInputType.textQuery,
        fields: ['place_id'],
        key: GOOGLE_MAPS_API_KEY
      }
    });

    if (addressResponse.data.candidates && addressResponse.data.candidates.length > 0) {
      return addressResponse.data.candidates[0].place_id;
    }

    return null;
  } catch (error: any) {
    console.error(`    Error finding place: ${error.message}`);
    return null;
  }
}

/**
 * Get Place Details
 */
async function getPlaceDetails(placeId: string): Promise<BoothEnrichment> {
  try {
    const response = await googleMapsClient.placeDetails({
      params: {
        place_id: placeId,
        fields: [
          'opening_hours',
          'formatted_phone_number',
          'website',
          'rating',
          'user_ratings_total',
          'photos',
          'business_status'
        ],
        key: GOOGLE_MAPS_API_KEY
      }
    });

    const result = response.data.result;
    const enrichment: BoothEnrichment = {};

    // Hours - using existing 'hours' column
    if (result.opening_hours?.weekday_text) {
      enrichment.hours = result.opening_hours.weekday_text.join(', ');
    }

    // Phone - using existing 'phone' column
    if (result.formatted_phone_number) {
      enrichment.phone = result.formatted_phone_number;
    }

    // Website - using existing 'website' column
    if (result.website) {
      enrichment.website = result.website;
    }

    // Photos - using existing 'photos' column (stored as string array)
    if (result.photos && result.photos.length > 0) {
      const photoReferences = result.photos.slice(0, 5).map(photo => photo.photo_reference);
      enrichment.photos = photoReferences.map(ref =>
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${ref}&key=${GOOGLE_MAPS_API_KEY}`
      );
    }

    // Operational status - using existing 'is_operational' column
    enrichment.is_operational = result.business_status === 'OPERATIONAL';

    // Include rating in description for now (since we don't have google_rating column)
    if (result.rating && result.user_ratings_total) {
      enrichment.description = `Google Rating: ${result.rating}/5.0 (${result.user_ratings_total} reviews)`;
    }

    return enrichment;

  } catch (error: any) {
    console.error(`    Error getting place details: ${error.message}`);
    return {};
  }
}

/**
 * Enrich a single booth
 */
async function enrichBooth(booth: any): Promise<BoothEnrichment | null> {
  console.log(`\n📍 ${booth.name}`);
  console.log(`   ${booth.address}, ${booth.city}, ${booth.country}`);

  // Step 1: Find place
  const placeId = await findPlace(
    booth.name,
    booth.address,
    booth.city,
    booth.country
  );

  if (!placeId) {
    console.log(`   ⚠️  Place not found`);
    return null;
  }

  console.log(`   ✅ Found: ${placeId}`);

  // Step 2: Get details
  const enrichment = await getPlaceDetails(placeId);

  // Log what we found
  if (enrichment.hours) console.log(`   🕒 Hours: ${enrichment.hours.substring(0, 50)}...`);
  if (enrichment.phone) console.log(`   📞 Phone: ${enrichment.phone}`);
  if (enrichment.website) console.log(`   🌐 Website: ${enrichment.website}`);
  if (enrichment.description) console.log(`   ⭐ ${enrichment.description}`);
  if (enrichment.photos) console.log(`   📸 Photos: ${enrichment.photos.length}`);
  if (enrichment.is_operational !== undefined) console.log(`   ✅ Operational: ${enrichment.is_operational}`);

  return enrichment;
}

/**
 * Main execution
 */
async function main() {
  console.log('🗺️  Starting Google Maps Enrichment\n');

  const BATCH_SIZE = parseInt(process.argv[2] || '20');
  console.log(`Batch size: ${BATCH_SIZE} booths\n`);

  // Get booths that need enrichment (active, with coordinates)
  const { data: booths, error } = await supabase
    .from('booths')
    .select('id, name, address, city, country, latitude, longitude, status')
    .eq('status', 'active')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .limit(BATCH_SIZE);

  if (error) {
    console.error('Error fetching booths:', error);
    return;
  }

  if (!booths || booths.length === 0) {
    console.log('No booths need enrichment!');
    return;
  }

  console.log(`Found ${booths.length} booths to enrich\n`);
  console.log('='.repeat(60));

  let enriched = 0;
  let notFound = 0;
  let errors = 0;

  for (const booth of booths) {
    try {
      const enrichment = await enrichBooth(booth);

      if (enrichment) {
        // Update database
        const { error: updateError } = await supabase
          .from('booths')
          .update(enrichment)
          .eq('id', booth.id);

        if (updateError) {
          console.error(`   ❌ Error updating: ${updateError.message}`);
          errors++;
        } else {
          console.log(`   ✅ Enriched`);
          enriched++;
        }
      } else {
        notFound++;
      }

      // Rate limiting: Google allows 50 requests/second, but let's be conservative
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error(`   ❌ Error processing:`, error);
      errors++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Enriched: ${enriched}`);
  console.log(`⚠️  Not found: ${notFound}`);
  console.log(`❌ Errors: ${errors}`);
  console.log('='.repeat(60));

  // Cost estimation
  const costPerBooth = 0.05; // Approximate: Text Search + Place Details + Photos
  const estimatedCost = enriched * costPerBooth;
  console.log(`\n💰 Estimated cost: $${estimatedCost.toFixed(2)}`);

  console.log('\n✨ Done!');
}

main().catch(console.error);
