
import { transformBooth } from '../../src/lib/transformers/booth-transformer';
import { Booth } from '../../src/types';

const BAD_BOOTH: Booth = {
  id: "8a777388-c4d2-4dcf-aa8a-ba9c25fae913",
  name: "Red Light Clothing Exchange",
  slug: "red-light-clothing-exchange-portland",
  address: "2590 SE Hawthorne Blvd.",
  city: "Portland",
  state: null,
  country: "United States",
  postal_code: null,
  latitude: 45.5119844,
  longitude: -122.6394005,
  machine_model: null,
  machine_year: null,
  machine_manufacturer: null,
  machine_serial: null,
  booth_type: null,
  photo_type: null,
  operator_id: null,
  operator_name: null,
  photo_exterior_url: null,
  photo_interior_url: null,
  photo_sample_strips: null,
  ai_preview_url: null,
  ai_preview_generated_at: "2025-11-29T06:02:31.776+00:00",
  status: "active",
  is_operational: true,
  hours: null,
  cost: null,
  accepts_cash: true,
  accepts_card: false,
  description: null,
  historical_notes: null,
  access_instructions: null,
  features: null,
  source_primary: null,
  source_urls: null,
  source_verified_date: null,
  created_at: "2025-11-29T02:40:46.849+00:00",
  updated_at: "2025-11-30T01:18:47.800279+00:00",
  last_verified: null
};

console.log('Testing Transformer with Red Light Data...');
const safe = transformBooth(BAD_BOOTH);

console.log('City:', safe.city); // Should be "Portland"
console.log('Location String:', safe.locationString); // Should be "Portland, United States"
console.log('Has City:', safe.hasCity); // Should be true
console.log('Status:', safe.status); // Should be "active"

if (!safe.city) throw new Error("City is missing!");
if (!safe.locationString) throw new Error("Location string is missing!");

console.log('✅ Transformer Test Passed');
