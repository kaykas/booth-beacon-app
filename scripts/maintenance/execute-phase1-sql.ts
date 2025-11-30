#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tmgbmcbwfkvmylmfpkzy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function executePhase1() {
  console.log('\n=== EXECUTING PHASE 1: Adding 6 Critical Sources ===\n');

  const sources = [
    {
      source_name: 'Classic Photo Booth Network',
      source_url: 'https://classicphotobooth.net/locations-2/',
      source_type: 'DIRECTORY',
      priority: 1,
      enabled: true,
      notes: 'Major East Coast restoration network (NYC/Philadelphia). Expected yield: 30-50 verified analog booths. NOTE: Use .net domain, not .com. Community-trusted source for chemical booth locations.'
    },
    {
      source_name: 'Photomatica - West Coast Network',
      source_url: 'https://photomatica.com/locations',
      source_type: 'DIRECTORY',
      priority: 1,
      enabled: true,
      notes: 'San Francisco and Los Angeles vintage booth network. Expected yield: 20-40 locations. IMPORTANT: Filter for "Vintage" or "Public" booths only (exclude digital event rentals). High-quality chemical booth source.'
    },
    {
      source_name: 'Louie Despres Photobooth Project',
      source_url: 'https://louiedespres.com/photobooth-project',
      source_type: 'DIRECTORY',
      priority: 1,
      enabled: true,
      notes: 'USA nationwide "Dip & Dunk" tracker. LAST UPDATED: 2024 (verified current). Expected yield: 40-60 locations across United States. Specializes in chemical processing booths. Community-verified analog only.'
    },
    {
      source_name: 'Autofoto - UK/Spain Network',
      source_url: 'https://www.autofoto.org/locations',
      source_type: 'DIRECTORY',
      priority: 1,
      enabled: true,
      notes: 'Rafael Hortala-Vallve network covering London and Barcelona. Major European analog booth operator. Expected yield: 20-40 locations. High-quality vintage booths with community validation.'
    },
    {
      source_name: 'Fotoautomatica - Florence',
      source_url: 'https://www.fotoautomatica.com/',
      source_type: 'DIRECTORY',
      priority: 1,
      enabled: true,
      notes: 'Italian street booths concentrated in Florence. Expected yield: 15-25 locations. Famous for vintage analog machines in historic city locations. Tourist-friendly, well-maintained booths.'
    },
    {
      source_name: 'Automatfoto - Stockholm Network',
      source_url: 'https://automatfoto.se/',
      source_type: 'DIRECTORY',
      priority: 2,
      enabled: true,
      notes: 'Hidden Stockholm/Sweden network. Expected yield: 10-20 locations. Fills geographic gap in Scandinavia. Chemical booth focus, community-operated.'
    }
  ];

  let added = 0;
  let updated = 0;

  for (const source of sources) {
    // Check if source already exists
    const { data: existing } = await supabase
      .from('crawl_sources')
      .select('id')
      .eq('source_url', source.source_url)
      .single();

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('crawl_sources')
        .update({
          ...source,
          updated_at: new Date().toISOString()
        })
        .eq('source_url', source.source_url);

      if (error) {
        console.error(`❌ Error updating ${source.source_name}:`, error);
      } else {
        console.log(`✓ Updated: ${source.source_name}`);
        updated++;
      }
    } else {
      // Insert new
      const { error } = await supabase
        .from('crawl_sources')
        .insert({
          ...source,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error(`❌ Error inserting ${source.source_name}:`, error);
      } else {
        console.log(`✓ Added: ${source.source_name}`);
        added++;
      }
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Sources added: ${added}`);
  console.log(`Sources updated: ${updated}`);
  console.log(`Total: ${added + updated} / 6`);

  // Verify
  const { count } = await supabase
    .from('crawl_sources')
    .select('*', { count: 'exact', head: true })
    .eq('enabled', true);

  console.log(`\nTotal enabled sources in database: ${count}`);
  console.log('\n✅ Phase 1 complete! Run crawler to collect booths from new sources.');
}

executePhase1().catch(console.error);
