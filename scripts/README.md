# Booth Beacon Scripts

This directory contains utility scripts for managing the Booth Beacon application.

## Geocoding Scripts

Scripts for geocoding booth addresses (adding latitude/longitude coordinates).

### Quick Start

See: [QUICK-START.md](./QUICK-START.md) for the 3-step process.

### Main Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `quick-deploy-test.sh` | Test if geocoding function is deployed | `./scripts/quick-deploy-test.sh` |
| `geocode-all-batches.sh` | Automatically geocode all booths | `./scripts/geocode-all-batches.sh` |
| `run-geocoding.js` | Manually run one batch of geocoding | `node scripts/run-geocoding.js` |
| `check-missing-coordinates.js` | Check how many booths need geocoding | `node scripts/check-missing-coordinates.js` |
| `sample-booths.js` | View sample booths missing coordinates | `node scripts/sample-booths.js` |

### Deployment Scripts

| Script | Purpose |
|--------|---------|
| `deploy-geocode-function.sh` | Deploy via CLI (requires access token) |
| `deploy-via-api.sh` | Attempt API deployment (experimental) |

### Documentation

| File | Description |
|------|-------------|
| [QUICK-START.md](./QUICK-START.md) | 3-step quick start guide |
| [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md) | Complete step-by-step deployment guide |
| [GEOCODING-README.md](./GEOCODING-README.md) | Technical documentation and API details |
| [manual-deploy-instructions.md](./manual-deploy-instructions.md) | Alternative deployment methods |

### Main Report

See the project root for the comprehensive report:
- [../GEOCODING-REPORT.md](../GEOCODING-REPORT.md)

## Current Status

Check status: `node scripts/check-missing-coordinates.js`

As of last check:
- Total booths: 912
- Missing coordinates: 909 (99.7%)
- With coordinates: 3 (0.3%)

## Common Commands

```bash
# Set environment variable (required for all scripts)
export SUPABASE_SERVICE_ROLE_KEY=$(cat .env.local | grep SUPABASE_SERVICE_ROLE_KEY | cut -d= -f2)

# Check deployment status
./scripts/quick-deploy-test.sh

# Check how many booths need geocoding
node scripts/check-missing-coordinates.js

# View sample booths
node scripts/sample-booths.js

# Geocode everything (automatic)
./scripts/geocode-all-batches.sh

# Geocode one batch (manual)
node scripts/run-geocoding.js
```

## Requirements

- Node.js (installed)
- Supabase service role key in `.env.local`
- Geocoding Edge Function deployed to Supabase

## Support

For issues or questions:
1. Check the [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md)
2. Review the [GEOCODING-README.md](./GEOCODING-README.md)
3. Check the main [GEOCODING-REPORT.md](../GEOCODING-REPORT.md)
