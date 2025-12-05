/**
 * Booth Recommendation Engine
 * Finds similar booths based on machine model, type, location, and other attributes
 */

import { createPublicServerClient } from '@/lib/supabase';

interface BoothForRecommendation {
  id: string;
  name: string;
  slug: string;
  city?: string;
  state?: string;
  country?: string;
  machine_model?: string;
  machine_manufacturer?: string;
  booth_type?: string;
  photo_type?: string;
  cost?: string;
  photo_exterior_url?: string;
  ai_preview_url?: string;
  status?: string;
}

interface ScoredBooth extends BoothForRecommendation {
  similarity_score: number;
}

/**
 * Get similar booths using a scoring algorithm
 */
export async function getSimilarBooths(
  boothId: string,
  limit: number = 6
): Promise<ScoredBooth[]> {
  const supabase = createPublicServerClient();

  // Get the source booth
  const { data: sourceBooth, error: sourceError } = await supabase
    .from('booths')
    .select('*')
    .eq('id', boothId)
    .single();

  if (sourceError || !sourceBooth) {
    console.error('Error fetching source booth:', sourceError);
    return [];
  }

  // Get candidate booths (active only, exclude source)
  const { data: candidates, error: candidatesError } = await supabase
    .from('booths')
    .select('id, name, slug, city, state, country, machine_model, machine_manufacturer, booth_type, photo_type, cost, photo_exterior_url, ai_preview_url, status')
    .neq('id', boothId)
    .eq('status', 'active')
    .limit(500); // Get more candidates to score

  if (candidatesError || !candidates) {
    console.error('Error fetching candidate booths:', candidatesError);
    return [];
  }

  // Score each candidate
  const scored: ScoredBooth[] = candidates.map((candidate) => ({
    ...candidate,
    similarity_score: calculateSimilarityScore(sourceBooth, candidate),
  }));

  // Sort by score and return top N
  return scored
    .sort((a, b) => b.similarity_score - a.similarity_score)
    .slice(0, limit);
}

/**
 * Calculate similarity score between two booths
 * Higher score = more similar
 */
function calculateSimilarityScore(
  source: BoothForRecommendation,
  candidate: BoothForRecommendation
): number {
  let score = 0;

  // Same machine model = +10 points (highest weight)
  if (source.machine_model && candidate.machine_model) {
    if (source.machine_model === candidate.machine_model) {
      score += 10;
    }
  }

  // Same manufacturer = +5 points
  if (source.machine_manufacturer && candidate.machine_manufacturer) {
    if (source.machine_manufacturer === candidate.machine_manufacturer) {
      score += 5;
    }
  }

  // Same booth type = +4 points
  if (source.booth_type && candidate.booth_type) {
    if (source.booth_type === candidate.booth_type) {
      score += 4;
    }
  }

  // Same photo type = +3 points
  if (source.photo_type && candidate.photo_type) {
    if (source.photo_type === candidate.photo_type) {
      score += 3;
    }
  }

  // Same country = +2 points
  if (source.country && candidate.country) {
    if (source.country === candidate.country) {
      score += 2;
    }
  }

  // Same state/region = +1 point
  if (source.state && candidate.state) {
    if (source.state === candidate.state) {
      score += 1;
    }
  }

  // Similar cost = +1 point
  if (source.cost && candidate.cost) {
    if (source.cost === candidate.cost) {
      score += 1;
    }
  }

  // Bonus: Has photos = +0.5 points (prefer booths with images)
  if (candidate.photo_exterior_url || candidate.ai_preview_url) {
    score += 0.5;
  }

  return score;
}

/**
 * Get booths with the same machine model
 */
export async function getBoothsByModel(
  machineModel: string,
  excludeBoothId?: string,
  limit: number = 10
): Promise<BoothForRecommendation[]> {
  const supabase = createPublicServerClient();

  let query = supabase
    .from('booths')
    .select('id, name, slug, city, state, country, machine_model, machine_manufacturer, booth_type, photo_type, cost, photo_exterior_url, ai_preview_url, status')
    .ilike('machine_model', `%${machineModel}%`)
    .eq('status', 'active')
    .limit(limit);

  if (excludeBoothId) {
    query = query.neq('id', excludeBoothId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching booths by model:', error);
    return [];
  }

  return data || [];
}

/**
 * Get booths by same manufacturer
 */
export async function getBoothsByManufacturer(
  manufacturer: string,
  excludeBoothId?: string,
  limit: number = 10
): Promise<BoothForRecommendation[]> {
  const supabase = createPublicServerClient();

  let query = supabase
    .from('booths')
    .select('id, name, slug, city, state, country, machine_model, machine_manufacturer, booth_type, photo_type, cost, photo_exterior_url, ai_preview_url, status')
    .ilike('machine_manufacturer', `%${manufacturer}%`)
    .eq('status', 'active')
    .limit(limit);

  if (excludeBoothId) {
    query = query.neq('id', excludeBoothId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching booths by manufacturer:', error);
    return [];
  }

  return data || [];
}
