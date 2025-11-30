
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface Source {
  name: string;
  url: string;
  type: 'core' | 'discovery' | 'blog' | 'supply_chain';
  region?: string;
  notes?: string;
}

const MASTER_SOURCES: Source[] = [
  // --- EUROPE ---
  { name: 'Photoautomat Berlin/Leipzig', url: 'http://www.photoautomat.de/standorte.html', type: 'core', region: 'Europe' },
  { name: 'Fotoautomat Paris/Prague', url: 'http://www.fotoautomat.fr/standorte.html', type: 'core', region: 'Europe' },
  { name: 'Autofoto London/Barcelona', url: 'https://www.autofoto.org/locations', type: 'core', region: 'Europe' },
  { name: 'Fotoautomatica Florence', url: 'https://www.fotoautomatica.com/', type: 'core', region: 'Europe' },
  { name: 'Fotoautomat Wien', url: 'https://www.fotoautomatwien.com/', type: 'core', region: 'Europe' },
  { name: 'Automatfoto Sweden', url: 'https://automatfoto.se/', type: 'discovery', region: 'Europe' },
  { name: 'Berlin Enthusiast Blog', url: 'https://feeistmeinname.de/search/label/Fotoautomat', type: 'blog', region: 'Europe' },
  { name: 'Phelt Magazine Berlin Guide', url: 'https://pheltmagazine.co/photo-booths-of-berlin/', type: 'blog', region: 'Europe' },
  { name: 'Girl in Florence Guide', url: 'https://girlinflorence.com/2012/01/24/the-perfect-guide-to-the-best-vintage-photo-shoot/', type: 'blog', region: 'Europe' },

  // --- NORTH AMERICA ---
  { name: 'Classic Photo Booth NYC/Philly', url: 'https://classicphotobooth.net/locations-2/', type: 'core', region: 'North America' },
  { name: 'Photomatica SF/LA', url: 'https://photomatica.com/locations', type: 'core', region: 'North America' },
  { name: 'Autophoto Chicago/Midwest', url: 'https://autophoto.org/locations', type: 'core', region: 'North America' },
  { name: 'Louie Despres Project', url: 'https://louiedespres.com/photobooth-project', type: 'discovery', region: 'North America' },
  { name: 'Find My Film Lab - LA', url: 'https://findmyfilmlab.com/photobooths', type: 'discovery', region: 'North America' },
  { name: 'Puddles Photo Booth Portland', url: 'https://puddlesphotobooth.com/blog/best-photo-booths-portland', type: 'blog', region: 'North America' },
  { name: 'DoTheBay SF Guide', url: 'https://dothebay.com/p/strike-a-pose-photo-booths-in-the-bay', type: 'blog', region: 'North America' },

  // --- ASIA & OCEANIA ---
  { name: 'Metro Auto Photo Australia', url: 'https://metroautophoto.com.au/locations', type: 'core', region: 'Oceania' },
  { name: 'Eternalog Fotobooth Seoul', url: 'https://eternalog-fotobooth.com', type: 'discovery', region: 'Asia' },
  
  // --- SUPPLY CHAIN / DEEP RESEARCH ---
  { name: 'Photrio Forum (Slavich Search)', url: 'https://www.photrio.com/forum/search/1?q=slavich+paper&o=date', type: 'supply_chain' },
  { name: 'Photo Systems Inc', url: 'https://photosys.com/', type: 'supply_chain' },
  { name: 'Autophoto Exhibitions (Technicians)', url: 'https://autophoto.org/exhibitions', type: 'supply_chain' }
];

async function seed() {
  console.log(`🌱 Seeding ${MASTER_SOURCES.length} Master Plan sources...`);

  for (const source of MASTER_SOURCES) {
    const { error } = await supabase
      .from('crawl_sources')
      .upsert({
        source_name: source.name,
        source_url: source.url,
        // You might need to adjust column names based on your exact schema
        // Assuming 'type' or 'category' column exists, if not, we put it in notes or ignore
        enabled: true,
        priority: source.type === 'core' ? 100 : 50,
      }, { onConflict: 'source_url' });

    if (error) {
      console.error(`❌ Failed to seed ${source.name}:`, error.message);
    } else {
      console.log(`✅ Seeded: ${source.name} [${source.type.toUpperCase()}]`);
    }
  }
}

seed().catch(console.error);
