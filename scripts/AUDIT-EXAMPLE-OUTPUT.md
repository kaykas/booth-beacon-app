# Geocoding Audit - Example Output

This document shows example output from running the geocoding audit script.

## Console Output

```
================================================================================
BOOTH BEACON GEOCODING AUDIT
================================================================================

Fetching all booths from database...
Retrieved 912 booths

SUMMARY STATISTICS
--------------------------------------------------------------------------------
Total Booths: 912
Booths with Problems: 156 (17.10%)

By Severity:
  CRITICAL: 34
  HIGH: 67
  MEDIUM: 55
  LOW: 0

By Category:
  MISSING_COORDINATES: 34
  NO_STREET_NUMBER: 45
  NAME_ONLY: 8
  TOO_SHORT: 23
  LOW_CONFIDENCE: 18
  DUPLICATE_COORDINATES: 16
  MISSING_ADDRESS: 12

Duplicate Coordinate Sets: 8
Booths at Duplicate Coordinates: 16

TOP 20 CRITICAL CASES
--------------------------------------------------------------------------------

1. Retro Booth NYC
   ID: 550e8400-e29b-41d4-a716-446655440000
   Address: [NO ADDRESS]
   Location: New York, USA
   Coords: null, null
   Issues: MISSING_ADDRESS, MISSING_COORDINATES

2. Time Machine Photos
   ID: 550e8400-e29b-41d4-a716-446655440001
   Address: Time Machine Photos
   Location: Los Angeles, USA
   Coords: 34.0522, -118.2437
   Issues: NAME_ONLY, MISSING_COORDINATES

3. Classic Memories
   ID: 550e8400-e29b-41d4-a716-446655440002
   Address: [NO ADDRESS]
   Location: Chicago, USA
   Coords: null, null
   Issues: MISSING_ADDRESS, MISSING_COORDINATES

4. Photo Strip Paradise
   ID: 550e8400-e29b-41d4-a716-446655440003
   Address: Main St
   Location: Boston, USA
   Coords: 42.3601, -71.0589
   Issues: NO_STREET_NUMBER, TOO_SHORT

5. Vintage Booth Co
   ID: 550e8400-e29b-41d4-a716-446655440004
   Address: 123
   Location: Miami, USA
   Coords: null, null
   Issues: TOO_SHORT, MISSING_COORDINATES

TOP HIGH PRIORITY CASES (sample)
--------------------------------------------------------------------------------

1. Snap Studio
   Address: 456 Oak Avenue
   Issues: NO_STREET_NUMBER

2. Flash Photos
   Address: Downtown
   Issues: NO_STREET_NUMBER, TOO_SHORT

3. The Booth
   Address: The Booth
   Issues: NAME_ONLY

4. Classic Cameras
   Address: Street
   Issues: NO_STREET_NUMBER, TOO_SHORT

5. Quick Shots
   Address: Park
   Issues: NO_STREET_NUMBER, TOO_SHORT

JSON Report saved to: /Users/jkw/Projects/booth-beacon-app/geocoding-audit-report.json
CSV Export saved to: /Users/jkw/Projects/booth-beacon-app/affected-booths.csv

================================================================================
AUDIT COMPLETE
================================================================================

Next steps:
1. Review the JSON report for detailed analysis
2. Use the CSV file to re-geocode affected booths
3. Focus on CRITICAL severity cases first
4. Consider bulk re-geocoding for incomplete addresses
```

## Example JSON Report

The `geocoding-audit-report.json` file contains:

```json
{
  "generated_at": "2025-12-08T14:32:45.123Z",
  "stats": {
    "total_booths": 912,
    "booths_with_problems": 156,
    "percentage_affected": "17.10",
    "critical_count": 34,
    "high_count": 67,
    "medium_count": 55,
    "low_count": 0,
    "by_category": {
      "MISSING_COORDINATES": 34,
      "NO_STREET_NUMBER": 45,
      "TOO_SHORT": 23,
      "LOW_CONFIDENCE": 18,
      "DUPLICATE_COORDINATES": 16,
      "NAME_ONLY": 8,
      "MISSING_ADDRESS": 12
    },
    "duplicate_coordinate_sets": 8,
    "booths_at_duplicate_coordinates": 16
  },
  "critical_cases": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Retro Booth NYC",
      "address": "[NO ADDRESS]",
      "city": "New York",
      "country": "USA",
      "latitude": null,
      "longitude": null,
      "geocode_confidence": null,
      "geocode_provider": null,
      "problems": [
        {
          "category": "MISSING_ADDRESS",
          "severity": "CRITICAL",
          "description": "Address is NULL or empty"
        },
        {
          "category": "MISSING_COORDINATES",
          "severity": "CRITICAL",
          "description": "Latitude: null, Longitude: null"
        }
      ],
      "severity": "CRITICAL",
      "created_at": "2025-11-15T10:30:00Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Time Machine Photos",
      "address": "Time Machine Photos",
      "city": "Los Angeles",
      "country": "USA",
      "latitude": 34.0522,
      "longitude": -118.2437,
      "geocode_confidence": "high",
      "geocode_provider": "nominatim",
      "problems": [
        {
          "category": "NAME_ONLY",
          "severity": "HIGH",
          "description": "Address is the same as business name"
        },
        {
          "category": "MISSING_COORDINATES",
          "severity": "CRITICAL",
          "description": "Latitude: OK, Longitude: OK"
        }
      ],
      "severity": "CRITICAL",
      "created_at": "2025-11-20T14:22:00Z"
    }
  ],
  "high_cases": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440010",
      "name": "Snap Studio",
      "address": "456 Oak Avenue",
      "city": "Denver",
      "country": "USA",
      "latitude": 39.7392,
      "longitude": -104.9903,
      "geocode_confidence": "medium",
      "geocode_provider": "nominatim",
      "problems": [
        {
          "category": "NO_STREET_NUMBER",
          "severity": "HIGH",
          "description": "Address contains no digits (likely incomplete)"
        }
      ],
      "severity": "HIGH",
      "created_at": "2025-12-01T09:15:00Z"
    }
  ],
  "duplicate_coordinates": [
    {
      "coordinates": "40.7128,-74.0060",
      "boothCount": 3,
      "booths": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440050",
          "name": "NYC Photo Booth #1",
          "address": "123 Times Square, New York, NY 10001"
        },
        {
          "id": "550e8400-e29b-41d4-a716-446655440051",
          "name": "NYC Photo Booth #2",
          "address": "123 Times Square, New York, NY 10001"
        },
        {
          "id": "550e8400-e29b-41d4-a716-446655440052",
          "name": "NYC Photo Booth #3",
          "address": "123 Times Square, New York, NY 10001"
        }
      ]
    },
    {
      "coordinates": "34.0522,-118.2437",
      "boothCount": 2,
      "booths": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440060",
          "name": "LA Classic Booth",
          "address": "456 Hollywood Blvd, Los Angeles, CA 90001"
        },
        {
          "id": "550e8400-e29b-41d4-a716-446655440061",
          "name": "LA Vintage Photos",
          "address": "456 Hollywood Blvd, Los Angeles, CA 90001"
        }
      ]
    }
  ],
  "all_affected_booths": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Retro Booth NYC",
      "address": "[NO ADDRESS]",
      "city": "New York",
      "country": "USA",
      "latitude": null,
      "longitude": null,
      "geocode_confidence": null,
      "geocode_provider": null,
      "problems": [
        {
          "category": "MISSING_ADDRESS",
          "severity": "CRITICAL",
          "description": "Address is NULL or empty"
        },
        {
          "category": "MISSING_COORDINATES",
          "severity": "CRITICAL",
          "description": "Latitude: null, Longitude: null"
        }
      ],
      "severity": "CRITICAL",
      "created_at": "2025-11-15T10:30:00Z"
    }
  ],
  "affected_booth_ids": [
    "550e8400-e29b-41d4-a716-446655440000",
    "550e8400-e29b-41d4-a716-446655440001",
    "550e8400-e29b-41d4-a716-446655440002",
    "550e8400-e29b-41d4-a716-446655440003",
    "550e8400-e29b-41d4-a716-446655440004"
  ]
}
```

## Example CSV Export

The `affected-booths.csv` file:

```csv
booth_id,booth_name,address,city,country,latitude,longitude,geocode_confidence,geocode_provider,severity,problem_categories
"550e8400-e29b-41d4-a716-446655440000","Retro Booth NYC","[NO ADDRESS]","New York","USA","","","unknown","unknown","CRITICAL","MISSING_ADDRESS; MISSING_COORDINATES"
"550e8400-e29b-41d4-a716-446655440001","Time Machine Photos","Time Machine Photos","Los Angeles","USA","34.0522","-118.2437","high","nominatim","CRITICAL","NAME_ONLY; MISSING_COORDINATES"
"550e8400-e29b-41d4-a716-446655440002","Classic Memories","[NO ADDRESS]","Chicago","USA","","","unknown","unknown","CRITICAL","MISSING_ADDRESS; MISSING_COORDINATES"
"550e8400-e29b-41d4-a716-446655440003","Photo Strip Paradise","Main St","Boston","USA","42.3601","-71.0589","medium","nominatim","HIGH","NO_STREET_NUMBER; TOO_SHORT"
"550e8400-e29b-41d4-a716-446655440004","Vintage Booth Co","123","Miami","USA","","","unknown","unknown","HIGH","TOO_SHORT; MISSING_COORDINATES"
"550e8400-e29b-41d4-a716-446655440010","Snap Studio","456 Oak Avenue","Denver","USA","39.7392","-104.9903","medium","nominatim","HIGH","NO_STREET_NUMBER"
"550e8400-e29b-41d4-a716-446655440050","NYC Photo Booth #1","123 Times Square, New York, NY 10001","New York","USA","40.7128","-74.0060","high","nominatim","MEDIUM","DUPLICATE_COORDINATES"
"550e8400-e29b-41d4-a716-446655440051","NYC Photo Booth #2","123 Times Square, New York, NY 10001","New York","USA","40.7128","-74.0060","high","nominatim","MEDIUM","DUPLICATE_COORDINATES"
"550e8400-e29b-41d4-a716-446655440052","NYC Photo Booth #3","123 Times Square, New York, NY 10001","New York","USA","40.7128","-74.0060","high","nominatim","MEDIUM","DUPLICATE_COORDINATES"
```

## Data Interpretation

### Raw Numbers

- **912 total** booths in system
- **156 problematic** (17.1%)
- **756 good** (82.9%)

### By Severity

- **34 critical** - Blocking issues (missing coords/address)
- **67 high** - Quality issues (incomplete/invalid addresses)
- **55 medium** - Minor issues (duplicates/low confidence)
- **0 low** - None in this example

### By Category

- **NO_STREET_NUMBER (45)** - Most common problem
  - Examples: "Main Street", "Park Avenue"
  - Fix: Add street number

- **MISSING_COORDINATES (34)** - Most blocking
  - Examples: All nulls
  - Fix: Re-geocode

- **TOO_SHORT (23)** - Missing parts
  - Examples: "123", "Main St"
  - Fix: Add city/state/zip

- **LOW_CONFIDENCE (18)** - Quality flag
  - Examples: Rough geocodes
  - Fix: Use better API

- **DUPLICATE_COORDINATES (16)** - Multiple booths same spot
  - Examples: 3 booths at Times Square
  - Fix: Verify or consolidate

- **NAME_ONLY (8)** - Invalid format
  - Examples: Name as address
  - Fix: Find real address

- **MISSING_ADDRESS (12)** - Empty/null
  - Examples: NULL values
  - Fix: Manual research

### Duplicates Detail

8 sets of duplicate coordinates found:

1. **Times Square (40.7128, -74.0060)**
   - 3 booths (likely legitimate multi-unit venue)
   - All at same address
   - Verify if operating independently

2. **Hollywood Blvd (34.0522, -118.2437)**
   - 2 booths
   - Same address
   - Possible duplicate entry

## Next Steps Based on Results

### Immediate (Day 1)

1. Document all 34 critical booths
2. Reach out to operators for missing data
3. Start geocoding missing coordinates

### This Week

1. Fix 50+ high priority issues
2. Research name-only addresses
3. Consolidate obvious duplicates

### This Month

1. Complete all medium priority fixes
2. Improve low-confidence geocodes
3. Verify duplicate coordinate handling

## Tools for Analysis

### Filter critical cases in JSON

```bash
jq '.critical_cases[] | {id, name, problems}' geocoding-audit-report.json
```

### Count by category

```bash
jq '.stats.by_category' geocoding-audit-report.json
```

### Export just affected IDs

```bash
jq '.affected_booth_ids[]' geocoding-audit-report.json > ids.txt
```

### Find duplicates

```bash
jq '.duplicate_coordinates[]' geocoding-audit-report.json
```

---

This example shows typical real-world data problems and how the audit surfaces them for systematic fixing.
