# Documentation Navigation Guide

**Last Updated:** January 4, 2026

---

## Quick Navigation Map

```
START HERE
│
├─ NEW SESSION (First Time)
│  │
│  ├─ 1. QUICK_START.md (10 min) ─────────┐
│  │   • Rapid orientation               │
│  │   • Essential commands              │
│  │   • Current priorities              │
│  │                                      │
│  ├─ 2. SESSION-SUMMARY.md (5 min) ─────┤
│  │   • Latest work completed           │
│  │   • Active blockers                 │
│  │   • Immediate next steps            │
│  │                                      │
│  ├─ 3. PROJECT_README.md (20 min) ─────┤
│  │   • Complete overview               │
│  │   • Architecture details            │
│  │   • All doc references              │
│  │                                      │
│  └─ 4. MASTER_TODO_LIST.md (15 min) ───┘
│      • Project roadmap
│      • Priority order
│      • Critical tasks
│
│
├─ RETURNING SESSION
│  │
│  ├─ SESSION-SUMMARY.md (5 min)
│  │   • Check active blockers
│  │   • Review next priorities
│  │
│  └─ Feature Docs (as needed)
│      • Use INDEX.md to find
│      • Read implementation guides
│
│
├─ WORKING ON FEATURE
│  │
│  ├─ INDEX.md
│  │   • Find feature docs
│  │   • Related documentation
│  │
│  ├─ Feature-Specific Docs
│  │   • Implementation guides
│  │   • Architecture details
│  │
│  └─ Completion Reports
│      • Similar features
│      • Lessons learned
│
│
├─ DEBUGGING ISSUE
│  │
│  ├─ PROJECT_README.md
│  │   • Architecture overview
│  │   • Common issues
│  │
│  ├─ Feature Docs
│  │   • Specific troubleshooting
│  │
│  └─ ARCHITECTURE.md
│      • Error handling
│      • System design
│
│
└─ PLANNING WORK
   │
   ├─ MASTER_TODO_LIST.md
   │   • Current priorities
   │   • Project roadmap
   │
   ├─ Feature Evaluation
   │   • Design decisions
   │   • Similar features
   │
   └─ Implementation Guides
       • Technical specs
       • Best practices
```

---

## Documentation Layers

### Layer 1: Quick Access (Read First)
```
QUICK_START.md          ─┐
SESSION-SUMMARY.md       ├─ Start every session here
PROJECT_README.md       ─┘  (15 minutes total)
```

**Purpose:** Get oriented quickly
**When:** Every new session
**Time:** 15 minutes

### Layer 2: Planning & Roadmap
```
MASTER_TODO_LIST.md     ─┐
PRD.md                   ├─ Understand direction
INDEX.md                ─┘  (30 minutes, skim)
```

**Purpose:** Understand priorities
**When:** Planning work, choosing tasks
**Time:** 30 minutes (skim)

### Layer 3: Technical Reference
```
ARCHITECTURE.md
DEPLOYMENT_SUMMARY.md
SETUP_GUIDE.md
[Feature-specific docs]
```

**Purpose:** Deep technical understanding
**When:** Working on features, debugging
**Time:** As needed (10-30 minutes per doc)

### Layer 4: Historical Context
```
Completion reports
Research documents
Legacy documentation
```

**Purpose:** Learn from past work
**When:** Planning similar features
**Time:** As needed

---

## By Use Case

### "I'm starting a new session"
```
1. Read QUICK_START.md               (10 min)
2. Read SESSION-SUMMARY.md           (5 min)
3. Skim MASTER_TODO_LIST.md         (5 min)
4. Choose task & read feature docs   (10 min)
─────────────────────────────────────────────
Total: 30 minutes to full productivity
```

### "I need to fix a bug"
```
1. Identify component/feature
2. Read feature docs from INDEX.md
3. Check ARCHITECTURE.md for system design
4. Review error handling patterns
5. Search docs for similar issues
```

### "I'm adding a new feature"
```
1. Check MASTER_TODO_LIST.md for priority
2. Read similar feature docs
3. Review ARCHITECTURE.md
4. Check implementation guides
5. Plan work, update documentation
```

### "I need a specific command"
```
1. Check QUICK_START.md → Common Commands
2. Or PROJECT_README.md → Common Tasks
3. Or feature docs → Implementation sections
4. Commands are copy-paste ready
```

### "I'm looking for documentation"
```
1. Open INDEX.md
2. Find section by topic or feature
3. Read listed documents
4. Follow cross-references
```

---

## Documentation by Topic

### Maps & Location
```
GEOCODING_VALIDATION_SYSTEM.md
STREET_VIEW_IMPLEMENTATION_GUIDE.md
STREET_VIEW_HANDOFF.md
MAP_PERFORMANCE_OPTIMIZATIONS.md
```

### Photos & Media
```
PHOTO_MANAGEMENT.md
PHOTO_DISPLAY_INVESTIGATION.md
PHOTO_UPLOAD_IMPLEMENTATION.md
AUTOPHOTO_ARCHITECTURE_DIAGRAM.md
COMMUNITY_PHOTOS_SETUP.md
```

### Crawler & Data
```
MASTER_CRAWLER_STRATEGY.md
ASYNC_CRAWLER_IMPLEMENTATION.md
CRAWLER_SETUP_GUIDE.md
FIRECRAWL_V2_UPGRADE_PLAN.md
DATA_ENRICHMENT_REPORT.md
```

### SEO & Discoverability
```
AI_SEO_IMPLEMENTATION_PLAN.md
KNOWLEDGE_GRAPH_ARCHITECTURE.md
ai-discoverability-roadmap.md
seo-domination-strategy.md
```

### Development & Deployment
```
ARCHITECTURE.md
DEPLOYMENT_SUMMARY.md
SETUP_GUIDE.md
TESTING.md
ON_DEMAND_REVALIDATION.md
```

---

## Quick Reference

### Most Important Files
```
1. QUICK_START.md              ← Start here
2. PROJECT_README.md           ← Complete overview
3. SESSION-SUMMARY.md          ← Latest status
4. MASTER_TODO_LIST.md         ← Priorities
5. INDEX.md                    ← Find anything
```

### Most Frequently Used
```
• QUICK_START.md               (every session)
• SESSION-SUMMARY.md           (every session)
• Feature-specific docs        (when working)
• ARCHITECTURE.md              (when debugging)
• INDEX.md                     (when searching)
```

### Most Comprehensive
```
• PROJECT_README.md            (25KB, complete overview)
• FIRECRAWL_V2_UPGRADE_PLAN.md (52KB, crawler upgrade)
• seo-domination-strategy.md   (50KB, SEO strategy)
• PRD.md                       (35KB, product requirements)
```

---

## File Status Indicators

```
✅ Complete      - Feature finished, documented, deployed
⏳ In Progress   - Actively being worked on
❌ Blocked       - Cannot proceed due to external issue
⚠️ Warning       - Needs attention or has issues
📝 Planned       - In roadmap, not yet started
🔄 Updated       - Recently modified
```

**Usage in files:**
```markdown
## Street View Validation ⏳

**Status:** 95% complete
**Blocker:** Google API key configuration ❌
**Next:** Update API key, run validation ✅
```

---

## Search Strategies

### Find Documentation
```bash
# By topic
grep -r "street view" docs/

# By filename
find docs/ -name "*street*"

# Recent files
ls -lt docs/ | head -20

# By content
grep -l "specific text" docs/*.md
```

### Find Code
```bash
# Find component
find src/ -name "*StreetView*"

# Find usage
grep -r "StreetViewEmbed" src/

# Find imports
grep -r "from.*street" src/
```

### Find History
```bash
# Commits about feature
git log --oneline --grep="street view"

# File history
git log --oneline -- docs/STREET_VIEW_HANDOFF.md

# Recent changes
git log --oneline -20
```

---

## Common Paths

### Path 1: Quick Task (30 minutes)
```
QUICK_START.md
  ↓
Check SESSION-SUMMARY.md for quick wins
  ↓
Execute task
  ↓
Update SESSION-SUMMARY.md
```

### Path 2: New Feature (2-4 hours)
```
MASTER_TODO_LIST.md (check priority)
  ↓
INDEX.md (find related docs)
  ↓
Read feature docs
  ↓
Read ARCHITECTURE.md
  ↓
Implement feature
  ↓
Update documentation
```

### Path 3: Bug Fix (1-2 hours)
```
Identify issue
  ↓
ARCHITECTURE.md (understand system)
  ↓
Feature docs (specific component)
  ↓
Search for similar issues
  ↓
Fix and test
  ↓
Document in SESSION-SUMMARY.md
```

### Path 4: Research (1-3 hours)
```
MASTER_TODO_LIST.md (check if planned)
  ↓
INDEX.md (find related research)
  ↓
Read historical docs
  ↓
External research
  ↓
Document findings
  ↓
Add to roadmap
```

---

## Pro Tips

### Start Every Session
```bash
# Quick orientation (5 minutes)
cat docs/QUICK_START.md | head -100
cat docs/SESSION-SUMMARY.md | head -50

# Check status
git status
git log --oneline -5
```

### Find Answers Fast
```bash
# Use INDEX.md as starting point
cat docs/INDEX.md | grep -A 5 "your topic"

# Search with context
grep -B 3 -A 3 "search term" docs/*.md

# Check multiple related docs
cat docs/STREET_VIEW*.md | grep "issue"
```

### Update Documentation
```bash
# After completing work
echo "✅ Completed feature X" >> docs/SESSION-SUMMARY.md

# Mark complete in roadmap
sed -i '' 's/\[ \] Feature X/\[x\] Feature X/' docs/MASTER_TODO_LIST.md
```

### Keep Context
```bash
# Save session notes
cat > docs/SESSION-NOTES-$(date +%Y%m%d).md <<EOF
# Session Notes - $(date +%Y-%m-%d)

## Completed
- Task 1
- Task 2

## In Progress
- Task 3

## Next
- Task 4
EOF
```

---

## Cheat Sheet

### Essential Commands
```bash
# Start session
cd /Users/jkw/Projects/booth-beacon-app
cat docs/QUICK_START.md
npm run dev

# Find docs
cat docs/INDEX.md | grep "topic"

# Search docs
grep -r "search" docs/

# Update status
vim docs/SESSION-SUMMARY.md

# Check roadmap
cat docs/MASTER_TODO_LIST.md | head -50
```

### Essential URLs
```
Project:     https://boothbeacon.org
Vercel:      https://vercel.com/jkw/booth-beacon-app
Supabase:    https://supabase.com/dashboard/project/tmgbmcbwfkvmylmfpkzy
Google:      https://console.cloud.google.com/apis/credentials
```

### Essential Files
```
Quick Start:    docs/QUICK_START.md
Project Info:   docs/PROJECT_README.md
Latest Status:  docs/SESSION-SUMMARY.md
Priorities:     docs/MASTER_TODO_LIST.md
Find Docs:      docs/INDEX.md
```

---

## Visual Flow

```
┌──────────────────────────────────────────────────────────┐
│                     NEW SESSION START                     │
└──────────────────┬───────────────────────────────────────┘
                   │
        ┌──────────▼───────────┐
        │  QUICK_START.md      │ (10 min)
        │  • Orientation       │
        │  • Commands          │
        │  • Priorities        │
        └──────────┬───────────┘
                   │
        ┌──────────▼───────────┐
        │ SESSION-SUMMARY.md   │ (5 min)
        │  • Latest work       │
        │  • Blockers          │
        │  • Next steps        │
        └──────────┬───────────┘
                   │
         ┌─────────▼────────────┐
         │    Choose Task       │
         └──┬──────────────┬────┘
            │              │
    ┌───────▼──────┐  ┌───▼──────────┐
    │ Quick Task   │  │ Major Feature│
    │ (30 min)     │  │ (2-4 hours)  │
    └───────┬──────┘  └───┬──────────┘
            │              │
            │    ┌─────────▼──────────┐
            │    │ Read Feature Docs  │
            │    │ • INDEX.md         │
            │    │ • Implementation   │
            │    │ • Architecture     │
            │    └─────────┬──────────┘
            │              │
            └──────┬───────┘
                   │
        ┌──────────▼───────────┐
        │  Do the Work         │
        │  • Code              │
        │  • Test              │
        │  • Document          │
        └──────────┬───────────┘
                   │
        ┌──────────▼───────────┐
        │ Update Docs          │
        │ • SESSION-SUMMARY    │
        │ • MASTER_TODO_LIST   │
        │ • Feature docs       │
        └──────────────────────┘
```

---

**Remember:**
- Start with QUICK_START.md
- Always check SESSION-SUMMARY.md
- Use INDEX.md to find documentation
- Update docs after completing work

---

**Last Updated:** January 4, 2026
**Purpose:** Help navigate Booth Beacon's documentation efficiently
