
import { EXCLUSION_KEYWORDS, EXCLUSION_LOCATIONS } from './constants';

export function getAnalogVerificationPrompt(content: string, sourceUrl: string): string {
  return `You are an Analog Verification Agent. Your goal is to identify TRUE analog (chemical/wet) photo booths and reject digital ones.

Source URL: ${sourceUrl}

RULES:
1. **Filter for Analog**: Look for keywords: 'wet strip', 'chemical smell', 'dip and dunk', 'developing time', 'silver gelatin', 'black and white only', 'Model 11', 'Model 14', 'Auto-Photo'.
2. **Exclude Digital**: Reject if mentions: ${EXCLUSION_KEYWORDS.join(', ')}, 'color prints' (unless specified as C-41 analog).
3. **Exclude Known Fakes**: Reject if location is: ${EXCLUSION_LOCATIONS.join(', ')}.

Analyze the text provided below.

Content:
${content.substring(0, 50000)}

Output Format:
Return ONLY a JSON object with this structure:
{
  "booths": [
    {
      "name": "Location Name",
      "address": "Full Address",
      "city": "City",
      "country": "Country",
      "evidence": "Quote from text proving it is analog (e.g. 'smells like chemicals')",
      "confidence": "high" | "medium" | "low"
    }
  ]
}

If no VALID ANALOG booths are found, return { "booths": [] }.`;
}
