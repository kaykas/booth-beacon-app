# City Guides Quick Reference

## 🗺️ Available City Guides

All guides are published and accessible in the database.

### Guide URLs (when frontend is built)
- **Berlin:** `/guides/berlin`
- **Chicago:** `/guides/chicago`
- **Los Angeles:** `/guides/los-angeles`
- **New York:** `/guides/new-york`
- **San Francisco:** `/guides/san-francisco`

---

## 📊 Quick Stats

| City | Booths | Time | Status |
|------|--------|------|--------|
| Berlin | 15 | 8-9 hrs | ✅ Published |
| New York | 15 | 8-9 hrs | ✅ Published |
| Los Angeles | 11 | 6-7 hrs | ✅ Published |
| San Francisco | 10 | 5-6 hrs | ✅ Published |
| Chicago | 8 | 4-5 hrs | ✅ Published |

**Total:** 59 booths across 5 cities

---

## 🔧 Management Scripts

### Verify Guides
```bash
bash scripts/run-verify-guides.sh
```

### Regenerate All Guides
```bash
bash scripts/run-city-guides.sh
```

### Check City Data
```bash
bash scripts/run-check-cities.sh
```

---

## 📦 Database Structure

### Table: `city_guides`

```sql
SELECT slug, city, country,
       array_length(booth_ids, 1) as booth_count,
       estimated_time, published
FROM city_guides
ORDER BY array_length(booth_ids, 1) DESC;
```

### Sample Record (Berlin)
```json
{
  "id": "uuid",
  "slug": "berlin",
  "city": "Berlin",
  "country": "Germany",
  "title": "Photo Booth Tour of Berlin",
  "description": "Discover 15 authentic analog photo booths...",
  "hero_image_url": "https://images.unsplash.com/photo-1560969184...",
  "estimated_time": "8-9 hours",
  "booth_ids": ["uuid1", "uuid2", ...],
  "tips": "• Most booths are concentrated in Mitte...",
  "published": true,
  "created_at": "2026-01-03T..."
}
```

---

## 🎨 Hero Images

All guides use high-quality Unsplash images:

- **Berlin:** Urban street scene (ID: 1560969184-10fe8719e047)
- **Chicago:** Cityscape (ID: 1477959858617-67f85cf4f1df)
- **Los Angeles:** Urban scene (ID: 1534190239940-9ba8944ea261)
- **New York:** Street scene (ID: 1496442226666-8d4d0e62e6e9)
- **San Francisco:** Skyline (ID: 1501594907352-04cda38ebc29)

All images are optimized at 1600px width with quality 80.

---

## 📋 Route Samples

### Berlin (15 stops)
1. ACUD → Mauerstreifen → Mauerpark 2 → Mauerpark → Kulturbrauerei
2. Frannz Club → Holzmarkt Marktplatz → Kater Blau Club
3. Markthalle Kreuzberg → Kottbusser Tor → Modulor Berlin
4. Hobrecht → Hermannstraße 227 → Amerika Haus → Forschungscampus Dahlem

### New York (15 stops)
1. Ace Hotel → The Smith - NoMad → The Smith → Niagara
2. The Magician → AUTOPHOTO → The Ripple Room → The Vintage Twin
3. Soho Diner → Roxy Hotel → Bubby's → Whitney Museum
4. The Lodge at Bryant Park → The Smith - Lincoln Square → The Smith - East Village

### Chicago (8 stops)
1. Lost Girls → Weegee's Lounge → Rainbo Club
2. Vintage House Chicago → Village Tap → The Village Tap
3. Metro → Skylark

---

## 🎯 Next Implementation Steps

### Frontend Pages Needed

1. **`/guides` - Guides Listing Page**
   - Grid/list of all city guides
   - Filter by continent/country
   - Search functionality
   - Sort by city name, booth count, or estimated time

2. **`/guides/[slug]` - Individual Guide Page**
   - Hero image header
   - City overview and description
   - Interactive map with route
   - Booth list with details
   - Tips section
   - "Start Tour" CTA
   - Print/share options

3. **Components to Create**
   - `CityGuideCard` - for listing page
   - `CityGuideMap` - interactive route map
   - `GuideBoothList` - ordered booth display
   - `GuideTips` - formatted tips section
   - `RouteNavigation` - step-by-step navigation

---

## 💡 Features to Add

### Phase 1 (Essential)
- [ ] Display guide route on map
- [ ] Show booth details in order
- [ ] Print-friendly view
- [ ] Share guide URL

### Phase 2 (Enhanced)
- [ ] "Mark as visited" checkboxes
- [ ] Personal notes per booth
- [ ] Tour progress tracking
- [ ] Estimated walk times between booths

### Phase 3 (Social)
- [ ] User photo uploads from tours
- [ ] Tour completion badges
- [ ] Community ratings
- [ ] Custom route builder

---

## 🐛 Known Issues

### Data Quality
- Chicago has only 8 booths (would benefit from more geocoding)
- Some US cities have country field variations (handled in script)
- State field inconsistencies (IL vs Illinois)

### Recommendations
1. Geocode remaining booths in Chicago, LA, SF
2. Standardize country field across database
3. Add more booths to smaller guides when data improves

---

## 📞 Support

For questions or issues:
- Check `/docs/CITY_GUIDES_SUMMARY.md` for detailed information
- Review `/scripts/seed-city-guides.ts` for implementation details
- Run verification scripts to confirm database state

---

**Last Updated:** January 3, 2026
**Version:** 1.0
**Status:** ✅ Production Ready
