# Admin Crawler Management Workflow

**Target User:** Alexandra Roberts (Product Manager / Admin)
**Last Updated:** November 28, 2025
**Purpose:** Guide for managing the Booth Beacon crawler system through the admin dashboard

---

## Overview

The Booth Beacon admin dashboard provides a complete workflow for managing the automated photo booth crawler. This workflow covers scheduling crawls, monitoring crawler health, analyzing performance, and troubleshooting issues.

## Accessing the Admin Dashboard

Navigate to `/admin` in the application to access the crawler management dashboard.

---

## Workflow Steps

### 1. Monitor Crawler Health

**Location:** Crawler Health Dashboard (top section of admin page)

**Purpose:** Get real-time overview of crawler status and identify issues

**Metrics to Monitor:**
- **Active Sources:** Number of enabled crawl sources
- **Recent Crawls:** Number of successful crawls in last 24 hours
- **Pending Jobs:** Jobs queued and waiting to run
- **Average Success Rate:** Percentage of successful vs failed crawls

**Health Indicators:**
- Green badges: Healthy performance
- Yellow badges: Warning - needs attention
- Red badges: Critical - immediate action required

**Action Items:**
- Check daily for overall system health
- Investigate sources with consecutive failures
- Review error patterns in failed crawls
- Disable sources that are consistently failing

---

### 2. Manage Crawl Job Queue

**Location:** Crawl Job Queue section

**Purpose:** Schedule and manage crawler execution

#### Adding a New Crawl Job

1. Click **"Add Job"** button
2. Select a source from the dropdown
3. Set priority (0-100):
   - **100 (High):** Urgent updates, new sources
   - **75 (Medium-High):** Regular important sources
   - **50 (Medium):** Standard crawl frequency
   - **25 (Low):** Low-priority or testing sources
4. Check **"Force crawl"** if you want to:
   - Bypass frequency limits
   - Force re-crawl even if recently updated
   - Test configuration changes
5. Click **"Add to Queue"**

#### Monitoring Job Status

Job statuses:
- **Pending:** Queued, waiting to run
- **Running:** Currently executing
- **Completed:** Successfully finished
- **Failed:** Encountered errors (see error message)
- **Cancelled:** Manually stopped

#### Managing Jobs

- **Cancel pending jobs:** Use pause icon for jobs not yet started
- **Delete completed jobs:** Use trash icon to clean up history
- **Review errors:** Click on failed jobs to see error details

#### Auto-Refresh

The queue auto-refreshes every 10 seconds to show current status.

---

### 3. Analyze Performance Metrics

**Location:** Crawl Performance Breakdown section

**Purpose:** Optimize crawler efficiency and identify bottlenecks

#### Time Distribution Analysis

Review the average time breakdown:
- **API Calls:** Time spent calling Firecrawl API
- **AI Extraction:** Time spent using Claude to extract booth data
- **Database Operations:** Time spent saving data to Supabase
- **Other (Dedup, Validation):** Time spent on data processing

**Optimization Targets:**
- API Calls: Should be <50% (consider caching if higher)
- AI Extraction: Expected to be 30-40% for AI-powered crawls
- Database: Should be <30% (optimize queries if higher)

#### Efficiency Metrics

Monitor these key performance indicators:
- **Avg Time / Page:** How long to crawl one page
- **Avg Time / Booth:** How long to extract one booth
- **Booths / Page:** Yield rate (target: >2 booths per page)
- **Total Pages/Booths:** Overall crawl volume
- **Sample Size:** Number of recent crawls analyzed

#### Performance Insights

The system automatically flags issues:
- **High API Call Time (>50%):** Consider implementing caching
- **AI Extraction Dominant (>40%):** Expected but could use faster models
- **Low Yield (<2 booths/page):** Target more booth-dense sources
- **Database Bottleneck (>30%):** Optimize queries or bulk inserts

#### Filter by Source

Use the source dropdown to analyze specific crawler sources and identify which ones need optimization.

---

## Common Workflows

### Morning Health Check (5 minutes)

1. Open Admin Dashboard
2. Check Crawler Health metrics
   - Verify success rate is >90%
   - Ensure no sources have >3 consecutive failures
3. Review Job Queue
   - Check for stuck "running" jobs (>2 hours old)
   - Clear completed/failed jobs from previous day
4. Scan Performance Insights
   - Look for new red/yellow alerts
   - Note any degrading trends

### Adding a New Photo Booth Source (10 minutes)

1. Add source to `crawl_sources` table (via Supabase Dashboard)
2. Configure:
   - Source URL
   - Extractor type
   - Crawl frequency (in days)
   - Pages per batch
3. Create initial crawl job with:
   - High priority (100)
   - Force crawl enabled
4. Monitor first run in Job Queue
5. Check Performance Breakdown for the new source
6. Adjust configuration if needed

### Troubleshooting Failed Crawls (15 minutes)

1. In Health Dashboard, identify source with failures
2. Check Job Queue for error messages
3. Common issues:
   - **Timeout errors:** Source is slow, reduce pages_per_batch
   - **404/403 errors:** URL changed, update source_url
   - **Extraction errors:** HTML structure changed, update extractor
   - **Rate limiting:** Increase crawl_frequency_days
4. Create test job with force crawl
5. Monitor execution
6. If still failing, disable source temporarily

### Weekly Performance Review (20 minutes)

1. Review Performance Breakdown (last 7 days)
2. Identify top 5 slowest sources
3. For each slow source:
   - Check average time per page
   - Review booth yield
   - Consider optimizations:
     - Reduce pages_per_batch
     - Adjust domain timeout config
     - Update extractor logic
4. Document findings and improvements

---

## Best Practices

### Job Scheduling

- Schedule high-priority sources during off-peak hours
- Spread crawls throughout the day to avoid API rate limits
- Use force crawl sparingly (it bypasses frequency controls)
- Clean up completed/failed jobs weekly to reduce clutter

### Performance Optimization

- Target 90%+ success rate across all sources
- Keep average crawl time under 60 seconds per source
- Maintain 2+ booths per page yield rate
- Monitor API call percentages - cache if >50%

### Error Handling

- Investigate sources with 3+ consecutive failures
- Document recurring error patterns
- Update extractors when website structures change
- Disable chronically failing sources

### Data Quality

- Spot-check newly added booths for accuracy
- Verify location data (city, country) is correct
- Ensure booth names are properly extracted
- Review image URLs are valid

---

## Crawler Configuration Reference

### Timeout Settings

```
Function timeout: 60s (90s buffer before 150s Supabase limit)
Per-source timeout: 60s
API call timeout: 30s
Domain-specific timeouts: 20s for slow sites
```

### Frequency Controls

Each source has a `crawl_frequency_days` setting:
- Daily sources: 1 day
- Weekly sources: 7 days
- Monthly sources: 30 days

Force crawl bypasses this check.

### Batch Processing

Sources crawl in batches:
- `pages_per_batch`: Number of pages to crawl per batch
- Default: 3 pages
- Slow sites (photobooth.net): 2 pages
- Crawler saves progress and continues in next batch if timeout approaching

---

## Admin Dashboard Components

### 1. CrawlerHealthDashboard
- Real-time health metrics
- Source status grid
- Failure alerts
- Recent crawl history

### 2. CrawlJobQueue
- Job scheduling interface
- Queue management
- Status monitoring
- Error display

### 3. CrawlPerformanceBreakdown
- Time distribution analysis
- Efficiency metrics
- Performance insights
- Source-specific filtering

---

## Troubleshooting Guide

### "Crawler timed out again"

**Cause:** Function exceeded 150s Supabase limit
**Solution:**
- Timeout check reduced to 60s (90s buffer)
- Timeout check added during extraction phase
- Redeploy crawler with updated timeout configuration

### "High API call time (>50%)"

**Cause:** Spending too much time calling Firecrawl
**Solution:**
- Implement caching for frequently crawled pages
- Reduce `pages_per_batch` for affected sources
- Consider batching requests

### "Low yield (<2 booths/page)"

**Cause:** Crawling pages with few photo booths
**Solution:**
- Target more booth-dense sources
- Improve extractor to find more booths
- Adjust crawl URL to focus on directory pages

### "Database bottleneck (>30%)"

**Cause:** Database operations taking too long
**Solution:**
- Optimize database queries
- Implement bulk inserts
- Review indexes on tables
- Check Supabase performance metrics

---

## Next Steps

### Future Enhancements

1. **Automated Scheduling:** Cron-based automatic crawls
2. **Webhook Notifications:** Slack/email alerts for failures
3. **Bulk Actions:** Enable/disable multiple sources at once
4. **Analytics Dashboard:** Historical trends and forecasting
5. **Source Testing:** Dry-run mode for new sources

### Database Migration Needed

Apply the job queue migration to enable full functionality:
```sql
-- Run this in Supabase Dashboard SQL Editor
-- File: supabase/migrations/006_crawl_job_queue.sql
```

---

## Support & Resources

**Technical Contact:** Jascha Kaykas-Wolff
**Documentation:** `/docs` directory
**API Docs:** Firecrawl (https://docs.firecrawl.dev)
**Dashboard:** Supabase Dashboard (https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy)

---

**Version:** 1.0
**Created:** November 28, 2025
**Last Review:** November 28, 2025
