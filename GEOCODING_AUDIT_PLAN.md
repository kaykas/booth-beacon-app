# Comprehensive Geocoding Audit & Fix Plan

## Problem Statement
Street View and maps are showing incorrect locations for booths because coordinates don't match the actual addresses. This is a systemic issue affecting multiple booths across the database.

## Root Causes Identified
1. **Duplicate entries** created incorrect coordinate pollution (FIXED: 397 duplicates removed)
2. **Geocoding errors** from automated geocoding services returning wrong coordinates
3. **Address quality issues** incomplete or ambiguous addresses being geocoded
4. **No validation** coordinates not verified against actual address after geocoding

## Comprehensive Fix Plan

### Phase 1: Audit & Identify Issues (Immediate)

#### 1.1 Create Geocoding Audit Script
**File**: `scripts/audit-geocoding.ts`

**Purpose**: Identify all booths with potentially incorrect coordinates

**Checks**:
- [ ] Coordinates exist but are far from city center (potential wrong city)
- [ ] Multiple booths at exact same coordinates (duplicate issue)
- [ ] Coordinates don't match street address (use reverse geocoding)
- [ ] Coordinates in wrong country
- [ ] Missing coordinates entirely

**Output**: CSV file with problematic booths ranked by confidence of error

#### 1.2 Create Manual Verification Interface
**File**: `src/app/admin/geocoding-verification/page.tsx`

**Features**:
- [ ] Show booth name, address, current coordinates
- [ ] Display Google Street View at current coordinates
- [ ] Display Google Maps with address marker
- [ ] Side-by-side comparison
- [ ] Quick approve/fix buttons
- [ ] Batch processing interface

### Phase 2: Automated Fixes (Quick Wins)

#### 2.1 Re-geocode Missing Coordinates
**Script**: `scripts/geocode-missing.ts` (already exists, enhance)

**Enhancements**:
- [ ] Add validation: verify result matches city in address
- [ ] Add confidence scoring: flag low-confidence results
- [ ] Add retry logic with different geocoding services
- [ ] Save geocoding source and confidence score

#### 2.2 Fix Obvious Errors
**Script**: `scripts/fix-obvious-errors.ts`

**Auto-fix rules**:
- [ ] If coordinates in wrong country → re-geocode
- [ ] If coordinates >50km from city center → re-geocode
- [ ] If multiple booths at exact coordinates → re-geocode individually
- [ ] If address changed but coordinates didn't → re-geocode

### Phase 3: Enhanced Geocoding System

#### 3.1 Multi-Service Geocoding
**File**: `lib/geocoding/multi-service.ts`

**Services to use** (in order):
1. **Google Maps Geocoding API** (most accurate, $5/1000)
2. **Mapbox Geocoding** (backup, different source)
3. **OpenStreetMap Nominatim** (free, fallback)

**Logic**:
- Try all three services
- Compare results
- If results differ >100m → flag for manual review
- Use highest confidence result
- Store all results for comparison

#### 3.2 Address Validation
**File**: `lib/geocoding/address-validator.ts`

**Validation steps**:
1. Parse address into components (street, city, state, zip, country)
2. Verify each component is present
3. Check for common errors (missing street number, wrong city)
4. Standardize format before geocoding

#### 3.3 Reverse Geocoding Verification
**File**: `lib/geocoding/reverse-verify.ts`

**Process**:
1. After geocoding address → coordinates
2. Reverse geocode coordinates → address
3. Compare original address with reverse geocoded address
4. If mismatch > threshold → flag for review
5. Calculate confidence score

### Phase 4: Database Schema Enhancements

#### 4.1 Add Geocoding Metadata Columns
**Migration**: `supabase/migrations/20251209000002_add_geocoding_metadata.sql`

**New columns**:
```sql
ALTER TABLE booths ADD COLUMN geocoding_source VARCHAR(50);
ALTER TABLE booths ADD COLUMN geocoding_confidence FLOAT;
ALTER TABLE booths ADD COLUMN geocoding_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE booths ADD COLUMN geocoding_verified_at TIMESTAMP;
ALTER TABLE booths ADD COLUMN geocoding_verified_by VARCHAR(255);
ALTER TABLE booths ADD COLUMN reverse_geocoded_address TEXT;
ALTER TABLE booths ADD COLUMN address_match_score FLOAT;
```

### Phase 5: Quality Assurance Process

#### 5.1 Batch Verification Tool
**Page**: `/admin/geocoding-verification`

**Workflow**:
1. Queue all unverified coordinates
2. Show 10 booths at a time for review
3. Display:
   - Original address
   - Current coordinates + Street View
   - Suggested coordinates (from re-geocoding) + Street View
   - Confidence scores
4. Admin can: Approve, Fix, Skip, Flag for later
5. Track verification progress

#### 5.2 Random Sampling
**Process**:
- Weekly: randomly sample 20 verified booths
- Re-check coordinates are still correct
- Catch any regressions or data drift

### Phase 6: Implementation Steps

#### Immediate Actions (Today)
1. ✅ Fix enrichment page bug (DONE)
2. [ ] Run profile trigger SQL (user action needed)
3. [ ] Create audit script to identify all problem booths
4. [ ] Generate CSV of top 100 most likely incorrect booths
5. [ ] Manually verify and fix Heebe Jeebe coordinates

#### This Week
1. [ ] Enhance geocoding scripts with validation
2. [ ] Add geocoding metadata columns to database
3. [ ] Create admin verification interface
4. [ ] Process top 100 problem booths

#### Next Week
1. [ ] Implement multi-service geocoding
2. [ ] Add reverse geocoding verification
3. [ ] Re-geocode all unverified booths with new system
4. [ ] Set up ongoing monitoring

### Success Metrics
- [ ] 95%+ of booths have verified coordinates
- [ ] 0 booths with obviously wrong coordinates (wrong city/country)
- [ ] Average address match score >0.85
- [ ] <5% of coordinates require manual correction
- [ ] Street View shows correct location for all booths

### Estimated Timeline
- **Phase 1 (Audit)**: 1 day
- **Phase 2 (Quick Fixes)**: 2 days
- **Phase 3 (Enhanced System)**: 3 days
- **Phase 4 (Schema)**: 1 day
- **Phase 5 (QA Process)**: 2 days
- **Phase 6 (Implementation)**: Ongoing

**Total**: ~2 weeks for complete system overhaul

### Priority Order
1. Fix Heebe Jeebe (immediate)
2. Create audit script (today)
3. Fix top 100 obvious errors (this week)
4. Implement enhanced geocoding (next week)
5. Verify all remaining booths (ongoing)
