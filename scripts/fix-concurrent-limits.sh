#!/bin/bash

# Quick fix for Firecrawl concurrent limit errors
# Increases delays between crawl triggers to respect API limits

echo ""
echo "==================================================================="
echo "Firecrawl Concurrent Limit Fix"
echo "==================================================================="
echo ""
echo "This script will increase delays in trigger scripts from 2-2.5s to 15s"
echo "to prevent hitting Firecrawl's concurrent scraping limit."
echo ""

# Backup files first
echo "📦 Creating backups..."
cp scripts/trigger-priority-90-crawls.ts scripts/trigger-priority-90-crawls.ts.backup
cp scripts/trigger-sf-crawls.ts scripts/trigger-sf-crawls.ts.backup
echo "   ✓ Backups created"
echo ""

# Fix trigger-priority-90-crawls.ts (line 67)
echo "🔧 Fixing scripts/trigger-priority-90-crawls.ts..."
sed -i '' 's/setTimeout(resolve, 2500)/setTimeout(resolve, 15000)/g' scripts/trigger-priority-90-crawls.ts
echo "   ✓ Delay changed: 2.5s → 15s"

# Fix trigger-sf-crawls.ts (line 75)
echo "🔧 Fixing scripts/trigger-sf-crawls.ts..."
sed -i '' 's/setTimeout(resolve, 2000)/setTimeout(resolve, 15000)/g' scripts/trigger-sf-crawls.ts
echo "   ✓ Delay changed: 2s → 15s"

echo ""
echo "==================================================================="
echo "✅ Fix Applied Successfully"
echo "==================================================================="
echo ""
echo "What changed:"
echo "  • trigger-priority-90-crawls.ts: 2.5s → 15s delay"
echo "  • trigger-sf-crawls.ts: 2s → 15s delay"
echo ""
echo "Why this works:"
echo "  With 15-second delays between triggers, you can safely trigger"
echo "  sources without exceeding Firecrawl's concurrent crawl limit."
echo ""
echo "  Formula: delay = (avg_crawl_time / concurrent_limit)"
echo "  Example: 60s average / 5 concurrent = 12s minimum"
echo "  Using 15s provides a safety margin."
echo ""
echo "Backups saved to:"
echo "  • scripts/trigger-priority-90-crawls.ts.backup"
echo "  • scripts/trigger-sf-crawls.ts.backup"
echo ""
echo "To revert changes:"
echo "  mv scripts/trigger-priority-90-crawls.ts.backup scripts/trigger-priority-90-crawls.ts"
echo "  mv scripts/trigger-sf-crawls.ts.backup scripts/trigger-sf-crawls.ts"
echo ""
echo "Next steps:"
echo "  1. Test with: npm run trigger-sf-crawls"
echo "  2. Monitor Firecrawl dashboard for concurrent count"
echo "  3. See FIRECRAWL_CONCURRENT_LIMIT_ANALYSIS.md for long-term solutions"
echo ""
