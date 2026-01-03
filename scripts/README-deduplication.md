# Deduplication Scripts

This directory contains scripts for identifying and removing duplicate booth entries from the database.

## Quick Start

### Check for Duplicates
```bash
npx tsx check-duplicate-addresses.ts
```

### Run Full Deduplication (3 passes)
```bash
# Pass 1: Smart address-based deduplication
npx tsx scripts/smart-deduplicate-booths.ts

# Pass 2: Aggressive deduplication of numbered entries
npx tsx scripts/aggressive-deduplicate-remaining.ts

# Pass 3: Final targeted cleanup
npx tsx scripts/final-targeted-deduplication.ts

# Verify results
npx tsx check-final-booth-stats.ts
```

## Scripts

### Diagnostic Scripts

#### `check-duplicate-addresses.ts`
Identifies duplicate booths by normalized address.

**Output**:
- Groups of booths with same address
- Data completeness for each booth
- Summary by city

**Usage**:
```bash
npx tsx check-duplicate-addresses.ts
```

#### `check-final-booth-stats.ts`
Shows final database statistics and remaining duplicates.

**Usage**:
```bash
npx tsx check-final-booth-stats.ts
```

### Deduplication Scripts

#### `smart-deduplicate-booths.ts` (Pass 1)
Smart deduplication based on address matching and data completeness scoring.

**Features**:
- Normalizes addresses (handles "Street" vs "St", etc.)
- Scores booths by data completeness
- Preserves legitimate multiple booths at same venue
- Merges data from duplicates into best entry
- Prioritizes high-value cities

**Safety**:
- Filters out venues with numbered booths (arcades, malls)
- Creates backup plan before deletion
- Only removes clear duplicates

#### `aggressive-deduplicate-remaining.ts` (Pass 2)
More aggressive pass to handle numbered entries and edge cases.

**Features**:
- Removes duplicates even when they have numbered names
- Only preserves if truly distinct (different booth types, descriptions)
- Handles variations in naming

#### `final-targeted-deduplication.ts` (Pass 3)
Final cleanup of city-only addresses and name variations.

**Features**:
- Targets booths with city-only addresses (no street)
- Handles name variations ("The Knockout" vs "Knockout")
- Very conservative approach

## Scoring Logic

Booths are scored based on data completeness:

| Factor | Points |
|--------|--------|
| Has coordinates | +10 |
| Has street number in address | +15 |
| Address ≠ name | +10 |
| Has description | +20 |
| Has exterior photo | +15 |
| Has interior photo | +10 |
| Has sample strips | +15 |
| Has booth type | +8 |
| Has machine model | +8 |
| Has hours | +7 |
| Has cost | +5 |
| Original slug (no number suffix) | +12 |
| Has source URLs | +3-10 (based on count) |

The booth with the highest score is kept, and data from duplicates is merged into it.

## Data Merging

When duplicates are found, the system:

1. **Selects best booth** (highest score)
2. **Merges data**:
   - Combines unique descriptions
   - Keeps best photos
   - Merges source_names arrays
   - Merges source_urls arrays
   - Fills in missing fields
3. **Deletes duplicates**

## Output Files

Each pass generates a detailed JSON plan:

- `deduplication-plan-enhanced.json` (Pass 1)
- `deduplication-plan-pass2.json` (Pass 2)
- `deduplication-plan-pass3.json` (Pass 3)

### Plan File Structure
```json
[
  {
    "keep": { /* Booth to keep */ },
    "merged": { /* Booth with merged data */ },
    "delete": [ /* Array of booths to delete */ ],
    "reason": "Best score: 85",
    "city": "chicago"
  }
]
```

## Safety Features

1. **Backup Plans**: JSON plans saved before deletion
2. **Conservative Filtering**: Preserves legitimate multiple booths
3. **Data Merging**: No data loss - all info merged into best entry
4. **Verification Scripts**: Check results after each pass

## When to Run

Run deduplication when:
- After bulk data imports
- When duplicate reports come in
- Monthly maintenance
- After crawler runs with high duplicate rates

## Environment

Requires:
- Node.js / Bun
- `.env.local` with `SUPABASE_SERVICE_ROLE_KEY`
- Write access to Supabase database

## Troubleshooting

### "No duplicates found"
The database is clean! Or the detection logic needs adjustment.

### "Failed to delete"
Check:
- Supabase service role key is valid
- Database permissions
- Foreign key constraints

### "Too many duplicates removed"
Review the JSON plan files to see what was removed. Plans contain full booth data for recovery if needed.

## Recovery

If deduplication removes too much:

1. Check the JSON plan files
2. Restore deleted booths from plan
3. Use Supabase database backups

## Future Improvements

- [ ] Add dry-run mode
- [ ] Interactive mode for manual review
- [ ] Machine learning for duplicate detection
- [ ] Better handling of venue complexes (like RAW in Berlin)
- [ ] Integration with crawler to prevent duplicates at ingestion
