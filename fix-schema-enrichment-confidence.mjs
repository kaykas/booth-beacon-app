// Add enrichment_confidence column
const SUPABASE_ACCESS_TOKEN = 'sbp_7e8b3b7e466f7cf341bb1c67106c7f98786edb4d';
const PROJECT_REF = 'tmgbmcbwfkvmylmfpkzy';

async function executeSQL() {
  const sql = `
    ALTER TABLE booths ADD COLUMN IF NOT EXISTS enrichment_confidence INTEGER;
    CREATE INDEX IF NOT EXISTS idx_booths_enrichment_confidence ON booths(enrichment_confidence);
  `;

  console.log('Adding enrichment_confidence column...');

  try {
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sql })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error (${response.status}):`, errorText);
      process.exit(1);
    }

    const result = await response.json();
    console.log('✅ Schema updated successfully!');
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

executeSQL();
