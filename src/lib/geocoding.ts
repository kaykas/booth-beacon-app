// Geocoding utility functions for admin panel

export interface GeocodeProgress {
  current: number;
  total: number;
  percentage: number;
}

export interface GeocodeStats {
  success: number;
  errors: number;
  skipped: number;
}

export interface GeocodeResult {
  name: string;
  success: boolean;
  latitude?: number;
  longitude?: number;
  error?: string;
}

export async function getMissingCoordsCount(supabase: any): Promise<number> {
  try {
    const { count } = await supabase
      .from('booths')
      .select('*', { count: 'exact', head: true })
      .or('latitude.is.null,longitude.is.null');

    return count || 0;
  } catch (error) {
    console.error('Error loading missing coords count:', error);
    return 0;
  }
}
