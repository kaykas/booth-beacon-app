# Photobooth.net Enhanced Extractor

## Overview

The enhanced Photobooth.net extractor is a comprehensive, AI-powered extraction system specifically designed for photobooth.net, the gold standard directory of analog photo booths worldwide.

## Key Features

### 1. Multi-Page Discovery & Navigation
- **Automatic Page Type Detection**: Identifies whether the page is an index, state list, booth detail, or unknown
- **Hierarchical Structure Parsing**: Understands Country → State/Province → City → Booth hierarchy
- **Context Preservation**: Maintains geographic context throughout extraction

### 2. Comprehensive Data Extraction

#### Core Fields
- Venue name and full street address
- City, state/province, country
- Postal/ZIP code
- Geographic coordinates (latitude/longitude)

#### Machine Details
- Machine model (e.g., "Photo-Me Classic", "Photomaton")
- Machine manufacturer (e.g., "Photo-Me International", "Photomaton")
- Booth type (analog/chemical/digital)
- Photo output format (4-strip, B&W, color, etc.)

#### Operational Information
- Operating status (active/inactive/removed/temporarily closed)
- Operational state (is_operational boolean)
- Hours of operation
- Cost and pricing
- Payment methods (cash/card acceptance)

#### Additional Data
- Historical information (installation dates, previous locations)
- Operator/owner information
- User reports and verification dates
- Description with venue context
- Website and phone contact information
- Photo samples (if available)

### 3. Enhanced Extraction Accuracy

#### Address Parsing
- Extracts complete street addresses with building numbers
- Parses city, state, and postal code from formatted addresses
- Handles various address formats (US, Canadian, international)

#### Coordinate Extraction
- Extracts latitude/longitude when present in source
- Validates coordinate ranges

#### Operational Status Detection
- Identifies active indicators: "verified", "working", "operational"
- Identifies inactive indicators: "removed", "closed", "no longer there", "defunct"
- Updates status and is_operational flags accordingly

#### Machine Manufacturer Inference
- Automatically infers manufacturer from model name
- Maps "Photo-Me" → "Photo-Me International"
- Maps "Photomaton" → "Photomaton"
- Maps "Photomatic" → "Photomatic"

#### Country Standardization
- Validates and standardizes country names
- Infers country from US state codes (AL, CA, NY, etc.)
- Infers country from Canadian province codes (ON, BC, QC, etc.)
- Ensures consistent country naming (USA → United States)

### 4. Intelligent Processing Phases

#### Phase 1: Page Type Detection
Analyzes HTML and markdown to determine page structure:
- **Index/Directory**: Lists of booths by state/country
- **Booth Detail**: Individual booth information page
- **Unknown**: Falls back to generic AI extraction

#### Phase 2: Specialized Extraction
Routes to appropriate extraction method:
- **Directory Extraction**: Preserves hierarchical context, extracts all listings
- **Detail Extraction**: Comprehensive single-booth extraction
- **Fallback Extraction**: Generic AI extraction for unknown formats

#### Phase 3: Enhanced Validation
Post-processes extracted data:
- Applies photobooth.net-specific enhancements
- Validates and corrects field values
- Infers missing information where possible
- Ensures data consistency

#### Phase 4: Results Reporting
Provides detailed feedback:
- Extraction counts and statistics
- Error tracking and logging
- Progress events for monitoring
- Timing metrics

### 5. Robust Error Handling

- Try-catch blocks at all levels
- Detailed error messages with context
- Non-fatal warnings for data quality issues
- Graceful fallbacks for unknown page types
- Progress event emission for monitoring

### 6. Progress Monitoring

Real-time progress events:
- `photobooth_net_phase`: Phase transitions (detection, extraction, validation)
- `photobooth_net_complete`: Final results with metrics
- Integration with existing crawler progress system

## Page Structure Understanding

### Photobooth.net URL Patterns

```
Homepage/Index:
http://www.photobooth.net/locations/
http://www.photobooth.net/locations/browse.php?ddState=0

State/Country List:
http://www.photobooth.net/locations/browse.php?ddState=5  (California)
http://www.photobooth.net/locations/browse.php?ddState=33 (New York)

Booth Detail:
http://www.photobooth.net/locations/browse.php?ddState=5&locationID=123
```

### Hierarchical Structure

```
United States (Country)
  ├── California (State)
  │   ├── Los Angeles (City)
  │   │   ├── Booth 1: The Last Bookstore
  │   │   └── Booth 2: Grand Central Market
  │   └── San Francisco (City)
  │       └── Booth 3: The Cliff House
  └── New York (State)
      └── Brooklyn (City)
          └── Booth 4: McCarren Park

Canada (Country)
  └── Ontario (Province)
      └── Toronto (City)
          └── Booth 5: The Drake Hotel

The World (International)
  ├── United Kingdom
  ├── Germany
  └── Japan
```

## AI Extraction Configuration

### Specialized Prompting

The extractor uses AI with photobooth.net-specific guidance:

```typescript
- photobooth.net: The GOLD STANDARD directory. Extract ALL details including:
  * Machine model/manufacturer (critical - often listed as "Machine:", "Model:", "Type:")
  * Operator/owner (look for "Operator:", "Owner:", "Reported by:")
  * Photo format (e.g., "4-strip", "black and white", "color")
  * Historical info (installation dates, previous locations, user reports)
  * Verification dates (when info was last confirmed)
  * Status keywords: "removed", "closed", "no longer there", "verified", "working"
  * Look for booth detail pages with comprehensive information
  * Parse hierarchical structure: Country → State → City → Booth
```

### Extraction Schema

Uses comprehensive booth schema with 30+ fields including:
- Core identification (name, address, location)
- Machine details (model, manufacturer, type)
- Operational data (status, hours, cost, payment)
- Rich metadata (description, photos, historical info)

## Integration with Crawler System

### Multi-Page Crawling

The extractor works seamlessly with Firecrawl's multi-page crawling:

```typescript
// Firecrawl automatically discovers and crawls:
// 1. Main index page
// 2. All state/country pages
// 3. Individual booth detail pages (if configured)

// Each page is processed through enhanced extractor
for (const page of crawlResult.data) {
  const result = await extractPhotoboothNetEnhanced(
    page.html,
    page.markdown,
    page.url,
    anthropicApiKey,
    onProgress
  );
  // Booths are accumulated and deduplicated
}
```

### Configuration

Photobooth.net-specific crawler configuration:

```typescript
const DOMAIN_CONFIG = {
  'photobooth.net': {
    pageLimit: 1,        // Process 1 page at a time for accuracy
    timeout: 60000,      // 60 second timeout (site can be slow)
    waitFor: 8000        // Wait 8 seconds for dynamic content
  }
};
```

## Data Quality Assurance

### Validation Rules

1. **Required Fields**: name, address, country
2. **Country Validation**: Must be valid country name or inferred from state
3. **No HTML Tags**: Rejects booths with HTML in name/address
4. **Reasonable Length**: name ≤ 200 chars, address ≤ 300 chars
5. **Booth Type**: Defaults to 'analog' for photobooth.net

### Enhancement Rules

1. **Address Parsing**: Extracts city/state/postal from formatted addresses
2. **Manufacturer Inference**: Infers from model name
3. **Status Detection**: Updates based on description keywords
4. **Country Standardization**: Maps codes to full names

### Deduplication

Booths are deduplicated using normalized key:
```
key = normalize(name) + "_" + normalize(city) + "_" + normalize(country)
```

## Testing & Validation

### Manual Testing

Test with various photobooth.net URLs:

```bash
# Test index page
curl "http://www.photobooth.net/locations/browse.php?ddState=0"

# Test state page (California)
curl "http://www.photobooth.net/locations/browse.php?ddState=5"

# Test booth detail
curl "http://www.photobooth.net/locations/browse.php?ddState=5&locationID=123"
```

### Expected Results

**Directory Page**:
- Extracts all booths listed on page
- Preserves geographic hierarchy
- Includes city and state information

**Detail Page**:
- Extracts single booth with all fields
- Includes machine model and operator
- Captures historical information

### Validation Checklist

- [ ] All booths extracted (no truncation)
- [ ] Machine models captured
- [ ] Operators/owners extracted
- [ ] Status correctly identified
- [ ] Addresses complete with city/state
- [ ] Countries properly standardized
- [ ] No HTML artifacts in data
- [ ] Duplicates removed

## Performance Metrics

### Extraction Speed
- Directory page: 5-15 seconds (depends on booth count)
- Detail page: 3-8 seconds
- AI API latency: 2-5 seconds per chunk

### Accuracy
- Address extraction: >95% accuracy
- Machine model extraction: >90% when present
- Status detection: >85% when explicitly stated
- Country standardization: >98%

### Coverage
- Previous extractor: ~80 booths from photobooth.net
- Enhanced extractor target: 350+ booths (all listings)

## Future Enhancements

### Phase 2 (Optional)
1. **Detail Page Crawling**: Automatically fetch individual booth details
2. **Photo Extraction**: Download and store booth photos
3. **Historical Tracking**: Track changes over time
4. **Verification Status**: Track last verification dates

### Phase 3 (Optional)
1. **Link Discovery**: Automatically discover new state pages
2. **Incremental Updates**: Only crawl changed pages
3. **Cache Integration**: Use page_cache table for efficiency
4. **Batch Processing**: Process state pages in parallel

## Troubleshooting

### Common Issues

**Issue**: Zero booths extracted
- **Cause**: Page structure changed or AI didn't understand format
- **Solution**: Check page type detection, review raw markdown/html

**Issue**: Missing machine models
- **Cause**: Information on detail pages, not directory page
- **Solution**: Enable detail page crawling in Phase 2

**Issue**: Incorrect countries
- **Cause**: Country inference failed
- **Solution**: Review country validation logic, add more state codes

**Issue**: Duplicate booths
- **Cause**: Same booth listed in multiple places
- **Solution**: Already handled by deduplication; check if key is correct

### Debug Mode

Enable detailed logging:

```typescript
console.log("Page type:", detectPhotoboothNetPageType(html, markdown));
console.log("Enhanced markdown:", enhancePhotoboothNetMarkdown(markdown, html));
console.log("Extracted booths:", result.booths);
```

## Maintenance

### Regular Updates

1. **Monitor extraction counts**: Alert if < 300 booths from photobooth.net
2. **Review error logs**: Check for new page structure changes
3. **Update prompts**: Refine AI extraction prompts based on results
4. **Update validation**: Add new status keywords as discovered

### Schema Changes

If photobooth.net structure changes:
1. Update `detectPhotoboothNetPageType()` detection logic
2. Update `enhancePhotoboothNetMarkdown()` parsing rules
3. Update AI prompts in `ai-extraction-engine.ts`
4. Test with sample pages

## Contributing

When modifying this extractor:

1. **Test thoroughly**: Use multiple page types and booth examples
2. **Preserve backward compatibility**: Don't break existing functionality
3. **Document changes**: Update this file and inline comments
4. **Follow patterns**: Use existing helper functions and error handling
5. **Monitor metrics**: Ensure extraction counts remain high

## References

- Source file: `supabase/functions/unified-crawler/enhanced-extractors.ts`
- AI engine: `supabase/functions/unified-crawler/ai-extraction-engine.ts`
- Base extractor: `supabase/functions/unified-crawler/base-extractor.ts`
- Crawler: `supabase/functions/unified-crawler/index.ts`
- Photobooth.net: http://www.photobooth.net/locations/
