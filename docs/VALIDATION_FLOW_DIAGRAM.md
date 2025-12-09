# Geocoding Validation Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        BOOTH GEOCODING REQUEST                          │
│                                                                         │
│  Input: { name, address, city, state, country }                        │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      LAYER 1: ADDRESS VALIDATION                        │
│                                                                         │
│  ✓ Has street number?      (e.g., "600")                               │
│  ✓ Has street name?        (e.g., "1st Ave N")                         │
│  ✓ Has city?               (e.g., "Minneapolis")                        │
│  ✓ Has country?            (e.g., "USA")                                │
│                                                                         │
│  Confidence: HIGH | MEDIUM | LOW | REJECT                               │
└────────────────────┬────────────────────────┬──────────────────────────┘
                     │ VALID                  │ REJECTED
                     ▼                        ▼
              ┌──────────────┐      ┌─────────────────────┐
              │   GEOCODE    │      │   SKIP & REPORT     │
              │   (Nominatim)│      │                     │
              └──────┬───────┘      │  Result: REJECTED   │
                     │              │  Issues: Incomplete │
                     │              │  Should Geocode: NO │
                     ▼              └─────────────────────┘
┌─────────────────────────────────────────────────────────────────────────┐
│                      NOMINATIM API RESPONSE                             │
│                                                                         │
│  {                                                                      │
│    lat: "44.9795",                                                      │
│    lon: "-93.2760",                                                     │
│    display_name: "Target Center, 600 1st Ave N, Minneapolis...",       │
│    type: "amenity",                                                     │
│    class: "place",                                                      │
│    address: { house_number, road, city, state, country }               │
│  }                                                                      │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   LAYER 2: RESULT VALIDATION                            │
│                                                                         │
│  📝 Name Match Score        (40 pts max) - Fuzzy match >70%            │
│     "Photo Booth" vs "Target Center, 600 1st Ave..."                   │
│     → 15% match = 6 points ⚠️                                           │
│                                                                         │
│  🏙️  City Match              (30 pts max) - Exact match                 │
│     "Minneapolis" in display_name?                                      │
│     → YES = 30 points ✓                                                 │
│                                                                         │
│  🏢 Place Type               (20 pts max) - Appropriate?                │
│     type="amenity" class="place"                                        │
│     → NOT highway/intersection = 20 points ✓                            │
│                                                                         │
│  📍 Address Components       (10 pts max) - Detailed?                   │
│     Has house_number & road?                                            │
│     → YES = 10 points ✓                                                 │
│                                                                         │
│  Total Match Score: 66/100                                              │
│  Confidence: MEDIUM                                                     │
└────────────────────┬────────────────────────┬──────────────────────────┘
                     │ SCORE ≥ 40            │ SCORE < 40
                     ▼                        ▼
              ┌──────────────┐      ┌─────────────────────┐
              │   CONTINUE   │      │   REJECT RESULT     │
              └──────┬───────┘      │                     │
                     │              │  Result: REJECTED   │
                     │              │  Issues: Low match  │
                     ▼              │  Score: 35/100      │
┌─────────────────────────────────────────────────────────────────────────┐
│                   LAYER 3: DISTANCE VALIDATION                          │
│                   (Only if existing coordinates)                        │
│                                                                         │
│  📏 Calculate distance between:                                         │
│     Existing: (44.9795, -93.2760)                                       │
│     New:      (44.9796, -93.2761)                                       │
│     → Distance: 13.6m                                                   │
│                                                                         │
│  🎯 Check threshold (based on address quality):                         │
│     Complete address: <50m    ✓                                         │
│     Partial address:  <200m   ✓                                         │
│     Business name:    <500m   ✓                                         │
│     Hard limit:       500m    ✓                                         │
│                                                                         │
│  Result: WITHIN THRESHOLD ✓                                             │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              LAYER 4: FINAL VALIDATION & CONFIDENCE                     │
│                                                                         │
│  Combine all layers:                                                    │
│  ├─ Layer 1: high     ✓                                                 │
│  ├─ Layer 2: medium   ○                                                 │
│  └─ Layer 3: valid    ✓                                                 │
│                                                                         │
│  Final Confidence: MEDIUM (lowest of all layers)                        │
│                                                                         │
│  Issues Collected:                                                      │
│  └─ "Poor name match (15%)"                                             │
│                                                                         │
│  🚩 Flag for Review?                                                     │
│     - Confidence = low?         NO                                      │
│     - Match score < 60?         NO (66)                                 │
│     - Distance > 200m?          NO (13.6m)                              │
│     - Has issues?               YES                                     │
│     → REVIEW: NO ✓                                                      │
└────────────────────┬────────────────────────┬──────────────────────────┘
                     │ VALID                  │ INVALID
                     ▼                        ▼
         ┌───────────────────────┐  ┌─────────────────────┐
         │   SAVE TO DATABASE    │  │   DON'T SAVE        │
         │                       │  │                     │
         │  latitude: 44.9796    │  │  Keep NULL coords   │
         │  longitude: -93.2761  │  │  Log rejection      │
         │  geocode_provider:    │  │  Report to admin    │
         │    "nominatim"        │  └─────────────────────┘
         │  geocode_confidence:  │
         │    "medium"           │
         │  geocode_match_score: │
         │    66                 │
         │  geocode_validation_  │
         │  issues:              │
         │    ["Poor name match"]│
         │  needs_geocode_       │
         │  review: false        │
         │  geocode_validated_at:│
         │    2025-12-08T18:00Z  │
         └───────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │   STREAM EVENT        │
         │                       │
         │  ○ Target Center      │
         │  (1/50) - medium      │
         │  confidence           │
         │                       │
         │  Match: 66/100        │
         └───────────────────────┘
```

## Validation Decision Matrix

### Layer 1: Address Completeness

| Street # | Street Name | City | Country | Confidence | Action      |
|----------|-------------|------|---------|------------|-------------|
| ✓        | ✓           | ✓    | ✓       | HIGH       | Geocode     |
| ✓        | ✓           | ✓    | ✗       | MEDIUM     | Geocode     |
| ✗        | ✓           | ✓    | ✓       | REJECT     | Skip        |
| ✓        | ✗           | ✓    | ✓       | REJECT     | Skip        |

### Layer 2: Result Validation

| Match Score | Name Match | City Match | Place Type | Confidence | Action |
|-------------|------------|------------|------------|------------|--------|
| ≥80         | >70%       | ✓          | ✓          | HIGH       | Accept |
| 60-79       | 50-70%     | ✓          | ✓          | MEDIUM     | Accept |
| 40-59       | 30-50%     | ✓ or ✗     | ✓          | LOW        | Flag   |
| <40         | <30%       | ✗          | ✗          | REJECT     | Reject |

### Layer 3: Distance Validation

| Distance | Address Quality | Threshold | Action       |
|----------|-----------------|-----------|--------------|
| <50m     | Complete        | 50m       | Accept       |
| <200m    | Partial         | 200m      | Accept       |
| <500m    | Business name   | 500m      | Accept       |
| >500m    | Any             | 500m      | Reject       |

### Layer 4: Review Flags

| Condition                | Flag for Review |
|--------------------------|-----------------|
| Confidence = low/reject  | YES             |
| Match score < 60         | YES             |
| Distance > 200m          | YES             |
| Inappropriate place type | YES             |
| Multiple issues          | YES             |
| Otherwise                | NO              |

## Example Scenarios

### ✅ Scenario 1: Perfect Match (HIGH Confidence)

```
Input:
  Name: "Target Center Photo Booth"
  Address: "600 1st Ave N"
  City: "Minneapolis"
  Country: "USA"

Layer 1: ✓ Complete address → HIGH
Layer 2: ✓ Match score 85 → HIGH
Layer 3: ✓ Distance 10m → VALID
Layer 4: ✓ HIGH confidence → ACCEPT

Result: SAVE with HIGH confidence, no review needed
```

### ⚠️ Scenario 2: Medium Match (MEDIUM Confidence)

```
Input:
  Name: "Mall Photo Studio"
  Address: "100 Main St"
  City: "Portland"
  Country: "USA"

Layer 1: ✓ Complete address → HIGH
Layer 2: ○ Match score 65 → MEDIUM (weak name match)
Layer 3: ✓ Distance 45m → VALID
Layer 4: ○ MEDIUM confidence → ACCEPT, FLAG FOR REVIEW

Result: SAVE with MEDIUM confidence, flag for review
```

### 🚫 Scenario 3: Incomplete Address (REJECTED)

```
Input:
  Name: "Downtown Booth"
  Address: "Main Street"  ← No street number!
  City: "Seattle"
  Country: "USA"

Layer 1: ✗ Incomplete address → REJECT
         Issues: ["Missing street number"]

Result: DON'T GEOCODE, skip booth
```

### 🚫 Scenario 4: Cross-Street Result (REJECTED)

```
Input:
  Name: "Corner Photo Booth"
  Address: "1st Ave & 5th St"
  City: "New York"
  Country: "USA"

Layer 1: ✓ Has address → MEDIUM
Layer 2: ✗ Match score 25 → REJECT
         Type: highway/intersection
         Issues: ["Inappropriate place type"]

Result: DON'T SAVE, reject result
```

### 🚫 Scenario 5: Distance Too Far (REJECTED)

```
Input:
  Name: "City Photo Booth"
  Address: "100 Main St"
  City: "Austin"
  Country: "USA"
  Existing: (30.2672, -97.7431)

Layer 1: ✓ Complete address → HIGH
Layer 2: ✓ Match score 75 → MEDIUM
Layer 3: ✗ Distance 800m → INVALID
         Issues: ["Distance exceeds 500m threshold"]

Result: DON'T SAVE, distance too far
```

## Emoji Legend

- ✓ Valid/Passed
- ○ Medium confidence
- △ Low confidence
- ✗ Failed/Rejected
- 🚩 Flagged for review
- ⊘ Skipped
- 📝 Name matching
- 🏙️ City matching
- 🏢 Place type
- 📍 Address components
- 📏 Distance calculation
- 🎯 Threshold check

---

**Implementation:** Complete
**Status:** Ready for deployment
**Next:** Apply migration, deploy function, run geocoding
