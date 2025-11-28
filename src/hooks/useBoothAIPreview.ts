/**
 * Hook for generating and managing AI preview images for booths
 */

import { useState, useCallback } from 'react';

interface UseBoothAIPreviewResult {
  generatePreview: (boothId: string) => Promise<string | null>;
  isGenerating: boolean;
  error: string | null;
}

export function useBoothAIPreview(): UseBoothAIPreviewResult {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePreview = useCallback(async (boothId: string): Promise<string | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/booths/generate-preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ boothId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate preview');
      }

      const data = await response.json();

      if (data.success && data.aiPreviewUrl) {
        return data.aiPreviewUrl;
      }

      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error generating AI preview:', errorMessage);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    generatePreview,
    isGenerating,
    error,
  };
}
