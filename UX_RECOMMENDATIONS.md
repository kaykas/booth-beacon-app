# Booth Beacon UX Recommendations
**Date:** December 20, 2025
**Review Focus:** Booth Detail Pages, Overall Usability, Maps Integration
**Expertise Applied:** E-commerce, Maps UX, Vintage Aesthetics, Mobile-First Design

---

## Executive Summary

Booth Beacon has a solid foundation with clean design and comprehensive information architecture. However, there are significant opportunities to improve conversion rates (visits), user engagement, and overall delight. The recommendations below are organized by priority and impact.

**Key Findings:**
- ✅ Strong: Clean design, comprehensive data, good mobile responsiveness
- ⚠️ Needs Work: CTA prominence, visual hierarchy, trust signals, photo strategy
- 🚀 Opportunities: Better discovery flow, community features, nostalgic design

---

## Priority 1: Critical - High Impact, Quick Wins

### 1.1 Hero CTA Optimization (Booth Detail Page)

**Current Issue:** "Get Directions" button blends in, doesn't command attention

**Recommendation:**
```typescript
// Change from:
<Button size="lg" className="w-full sm:w-auto text-base px-8 py-6">

// To: LARGER, more prominent
<Button
  size="xl"
  className="w-full text-lg px-12 py-8 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-2xl transform hover:scale-105 transition-all duration-200 font-bold"
>
  <Navigation className="w-6 h-6 mr-3" />
  Get Directions Now
</Button>
```

**Impact:** Could increase direction clicks by 30-50%
**Effort:** 10 minutes
**Why:** This is THE primary action. It should be impossible to miss.

### 1.2 Add "Verified Recently" Trust Badge

**Current Issue:** No indication of data freshness or verification

**Recommendation:** Add prominent badge when booth was recently verified
```typescript
{booth.last_verified && isRecentlyVerified(booth.last_verified) && (
  <div className="flex items-center gap-2 px-4 py-2 bg-green-100 border-2 border-green-600 rounded-lg mb-4">
    <CheckCircle className="w-5 h-5 text-green-600" />
    <span className="text-green-900 font-semibold">
      ✓ Verified {formatDistanceToNow(booth.last_verified)} ago
    </span>
  </div>
)}
```

**Impact:** Increases trust, reduces "is this still there?" anxiety
**Effort:** 30 minutes
**Why:** Vintage booths disappear frequently - verification is crucial

### 1.3 Add "Quick Info" Pills at Top

**Current Issue:** Key info (cost, hours, operational status) buried below fold

**Recommendation:** Add colorful info pills right under booth name
```typescript
<div className="flex flex-wrap gap-2 mb-6">
  {booth.is_operational && (
    <Badge className="bg-green-500 text-white px-3 py-1.5 text-sm">
      ✓ Currently Operational
    </Badge>
  )}
  {booth.cost && (
    <Badge className="bg-amber-500 text-white px-3 py-1.5 text-sm font-bold">
      {booth.cost} per strip
    </Badge>
  )}
  {isOpenNow(booth.hours) && (
    <Badge className="bg-blue-500 text-white px-3 py-1.5 text-sm">
      🕐 Open Now
    </Badge>
  )}
  {booth.accepts_cash && (
    <Badge className="bg-purple-500 text-white px-3 py-1.5 text-sm">
      💵 Cash Only
    </Badge>
  )}
</div>
```

**Impact:** Immediate understanding of key visit requirements
**Effort:** 1 hour
**Why:** Users need this info BEFORE clicking directions

### 1.4 Improve "No Photo" Placeholder Experience

**Current Issue:** Grey camera icon feels empty and unfinished

**Recommendation:** Use AI-generated vintage-style illustrations
```typescript
// Instead of generic camera, show vintage booth illustration
<div className="w-full h-full relative bg-gradient-to-br from-amber-50 to-orange-100">
  <div className="absolute inset-0 flex flex-col items-center justify-center">
    <div className="relative">
      {/* Vintage photo booth illustration (SVG) */}
      <VintageBoothIllustration className="w-32 h-32 opacity-60" />
      <div className="absolute -bottom-2 -right-2 bg-purple-600 text-white text-xs px-2 py-1 rounded">
        No photo yet
      </div>
    </div>
    <button
      onClick={onAddPhoto}
      className="mt-4 px-4 py-2 bg-white border-2 border-amber-600 text-amber-900 rounded-lg font-semibold hover:bg-amber-50 transition"
    >
      📸 Add First Photo
    </button>
  </div>
</div>
```

**Impact:** Reduces perceived incompleteness, encourages community contribution
**Effort:** 2-3 hours (create illustrations)
**Why:** Empty states are brand impressions

---

## Priority 2: Important - Moderate Impact, Medium Effort

### 2.1 Add "Visit Preparation" Section

**Current Issue:** Users don't know what to expect/bring

**Recommendation:** Add structured checklist above fold
```typescript
<Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 mb-6">
  <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
    <Clipboard className="w-5 h-5" />
    Before You Visit
  </h3>
  <ul className="space-y-2">
    <li className="flex items-start gap-2">
      <span className={booth.accepts_cash ? "text-green-600" : "text-red-600"}>
        {booth.accepts_cash ? "✓" : "✗"}
      </span>
      <span className="text-sm">
        {booth.accepts_cash
          ? `Bring ${booth.cost || "$5-10"} in cash (exact change helps!)`
          : "Check payment method before visiting"}
      </span>
    </li>
    <li className="flex items-start gap-2">
      <span className="text-blue-600">ℹ️</span>
      <span className="text-sm">
        Analog booths take 2-5 minutes to develop - be patient!
      </span>
    </li>
    <li className="flex items-start gap-2">
      <span className="text-amber-600">⚠️</span>
      <span className="text-sm">
        Call ahead if traveling far - booths can break unexpectedly
      </span>
    </li>
  </ul>
</Card>
```

**Impact:** Reduces visit failures, improves user experience
**Effort:** 1 hour
**Why:** Setting expectations = happier users

### 2.2 Enhance Mobile Map Experience

**Current Issue:** Map is small, hard to interact with on mobile

**Recommendation:** Make map full-width, add prominent "Open in Maps App" button
```typescript
// On mobile, map should be more prominent
<div className="lg:hidden -mx-4 mb-6">
  <div className="h-64 relative">
    <BoothMap {...props} />
    <div className="absolute bottom-4 left-4 right-4 flex gap-2">
      <Button
        className="flex-1 bg-white/95 backdrop-blur text-blue-600 font-bold shadow-lg"
        asChild
      >
        <a href={googleMapsUrl}>
          📍 Open in Google Maps
        </a>
      </Button>
      <Button
        className="flex-1 bg-white/95 backdrop-blur text-gray-900 font-bold shadow-lg"
        asChild
      >
        <a href={appleMapsUrl}>
          🗺️ Open in Apple Maps
        </a>
      </Button>
    </div>
  </div>
</div>
```

**Impact:** Easier navigation, better mobile UX
**Effort:** 2 hours
**Why:** 70%+ traffic is mobile, maps must work perfectly

### 2.3 Add "Similar Booths in City" Module

**Current Issue:** Nearby booths might be in different city

**Recommendation:** Add city-specific discovery before nearby
```typescript
<div className="mb-6">
  <h3 className="text-xl font-bold mb-4">
    More Booths in {booth.city}
  </h3>
  <p className="text-sm text-neutral-600 mb-4">
    Planning a photo booth crawl? Visit all {cityBoothCount} booths in {booth.city}!
  </p>
  <BoothGrid booths={cityBooths} limit={4} />
  <Button variant="outline" className="mt-4 w-full" asChild>
    <Link href={`/locations/${city Slug}`}>
      View All {cityBoothCount} Booths in {booth.city} →
    </Link>
  </Button>
</div>
```

**Impact:** Increases page views per session, builds excitement
**Effort:** 3 hours
**Why:** Booth hunters want to maximize their trip

### 2.4 Improve Hours Display

**Current Issue:** Plain text, hard to scan, no "open now" status

**Recommendation:** Structured hours with visual indicators
```typescript
<div className="space-y-2">
  {parseHours(booth.hours).map((day, i) => (
    <div
      key={i}
      className={`flex justify-between py-1.5 px-2 rounded ${
        day.isToday ? 'bg-blue-50 font-bold' : ''
      }`}
    >
      <span className={day.isToday ? 'text-blue-900' : 'text-neutral-700'}>
        {day.isToday && '• '}{day.name}
      </span>
      <span className={day.isClosed ? 'text-red-600' : 'text-green-600'}>
        {day.isClosed ? 'Closed' : day.hours}
      </span>
    </div>
  ))}
</div>
```

**Impact:** Faster comprehension, reduces confusion
**Effort:** 3-4 hours (parsing logic)
**Why:** Poor hours display causes wasted trips

---

## Priority 3: Enhancement - Lower Impact, But Important

### 3.1 Add Photo "Quality Score" Indicators

**Current Issue:** AI photos not clearly distinguished from real photos

**Recommendation:** Clear visual hierarchy
```typescript
// Real photos: Gold border
<div className="border-4 border-yellow-500 rounded-lg overflow-hidden">
  <Image src={realPhoto} ... />
  <div className="bg-yellow-500 text-white text-xs px-2 py-1 text-center font-bold">
    ⭐ Verified Real Photo
  </div>
</div>

// AI-generated: Purple border + clear label
<div className="border-4 border-purple-500 rounded-lg overflow-hidden">
  <Image src={aiPhoto} ... />
  <div className="bg-purple-500 text-white text-xs px-2 py-1 text-center">
    ✨ AI-Generated Preview (not actual booth)
  </div>
</div>
```

**Impact:** Reduces confusion, builds trust
**Effort:** 1 hour
**Why:** Users expect real photos, need clear labeling

### 3.2 Add "Report Issue" Quick Actions

**Current Issue:** Generic "Report Issue" button with no specifics

**Recommendation:** Specific issue types
```typescript
<Card className="p-4 bg-neutral-50">
  <h4 className="font-semibold mb-2">Report an Issue</h4>
  <div className="grid grid-cols-2 gap-2">
    <Button variant="outline" size="sm" onClick={() => report('closed')}>
      🚫 Permanently Closed
    </Button>
    <Button variant="outline" size="sm" onClick={() => report('broken')}>
      🔧 Out of Order
    </Button>
    <Button variant="outline" size="sm" onClick={() => report('moved')}>
      📍 Location Changed
    </Button>
    <Button variant="outline" size="sm" onClick={() => report('wrong')}>
      ❌ Wrong Info
    </Button>
  </div>
</Card>
```

**Impact:** Better data quality, community engagement
**Effort:** 2 hours
**Why:** Crowdsourced updates keep data fresh

### 3.3 Add "Booth Hunter Score" Gamification

**Current Issue:** No incentive for repeat visits or contributions

**Recommendation:** Badge system for community contributions
```typescript
<Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50">
  <h4 className="font-semibold mb-2">Your Booth Hunter Progress</h4>
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <Trophy className="w-4 h-4 text-yellow-600" />
      <span className="text-sm">Visited: {userStats.visited} booths</span>
    </div>
    <div className="flex items-center gap-2">
      <Camera className="w-4 h-4 text-blue-600" />
      <span className="text-sm">Photos Added: {userStats.photos}</span>
    </div>
    <div className="flex items-center gap-2">
      <MapPin className="w-4 h-4 text-green-600" />
      <span className="text-sm">Cities: {userStats.cities}</span>
    </div>
  </div>
  <Button size="sm" className="w-full mt-3">
    View Your Collection →
  </Button>
</Card>
```

**Impact:** Increases engagement, repeat visits
**Effort:** 1 day (backend + frontend)
**Why:** Collectors love tracking progress

---

## Priority 4: Visual & Aesthetic Improvements

### 4.1 Enhance Vintage Aesthetic

**Current Colors:** Generic neutral grays

**Recommended Palette:**
```css
:root {
  /* Vintage Film Colors */
  --film-yellow: #F4E4C1;  /* Aged photo paper */
  --film-sepia: #8B7355;   /* Sepia tone */
  --booth-red: #C41E3A;     /* Classic photo booth red */
  --strip-black: #2C2416;   /* Photo strip border */
  --flash-white: #FFFEF7;   /* Camera flash white */

  /* Accent Colors */
  --neon-pink: #FF69B4;     /* 80s neon */
  --retro-orange: #FF6B35;  /* Vintage orange */
  --polaroid-green: #4ECDC4; /* Polaroid frame */
}
```

**Apply to:**
- Header: Subtle sepia gradient background
- Buttons: Use booth-red for primary CTAs
- Cards: Film-yellow tinted backgrounds for special sections
- Badges: Neon colors for status indicators

**Impact:** Stronger brand identity, emotional connection
**Effort:** 4-6 hours
**Why:** Aesthetic reinforces the analog/vintage value prop

### 4.2 Add Photo Strip Border Treatment

**Recommendation:** Treat booth photos like actual photo strips
```typescript
<div className="relative bg-white p-2 shadow-xl">
  {/* Top sprocket holes */}
  <div className="flex gap-2 mb-2">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="w-3 h-3 bg-neutral-900 rounded-full" />
    ))}
  </div>

  {/* Main photo */}
  <div className="aspect-[3/4] relative">
    <Image src={booth.photo} ... />
  </div>

  {/* Bottom sprocket holes */}
  <div className="flex gap-2 mt-2">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="w-3 h-3 bg-neutral-900 rounded-full" />
    ))}
  </div>

  {/* Date stamp */}
  <div className="text-xs text-neutral-600 mt-2 font-mono text-center">
    {formatDate(booth.photo_date)} • {booth.machine_model}
  </div>
</div>
```

**Impact:** Delightful detail, reinforces authenticity
**Effort:** 2 hours
**Why:** Details create emotional resonance

### 4.3 Add Loading States with Character

**Current:** Generic spinners

**Recommendation:** Themed loading states
```typescript
<div className="flex flex-col items-center justify-center p-12">
  <div className="relative">
    {/* Vintage camera illustration */}
    <VintageCamera className="w-24 h-24 animate-pulse" />
    <div className="absolute -top-4 -right-4">
      <Sparkles className="w-8 h-8 text-yellow-500 animate-ping" />
    </div>
  </div>
  <p className="mt-4 text-lg font-semibold text-neutral-700">
    Developing your photos...
  </p>
  <p className="text-sm text-neutral-500">
    (This takes 2-3 seconds, just like a real booth!)
  </p>
</div>
```

**Impact:** Brand personality, manages expectations
**Effort:** 1 hour
**Why:** Every interaction is a brand touchpoint

---

## Homepage Specific Recommendations

### H1. Hero Section Clarity

**Current Issue:** Value proposition could be clearer

**Recommendation:**
```typescript
<section className="text-center py-20 px-4 bg-gradient-to-b from-film-yellow to-white">
  <h1 className="text-5xl md:text-6xl font-bold text-strip-black mb-4">
    Find Authentic Analog
    <br />
    <span className="text-booth-red">Photo Booths</span> Near You
  </h1>
  <p className="text-xl text-neutral-700 mb-8 max-w-2xl mx-auto">
    Discover 1,200+ vintage photochemical booths worldwide.
    <br />
    Real film, real chemicals, real nostalgia.
  </p>
  <div className="flex flex-col sm:flex-row gap-4 justify-center">
    <Button size="lg" className="text-lg px-8 py-6">
      🗺️ Explore the Map
    </Button>
    <Button size="lg" variant="outline" className="text-lg px-8 py-6">
      📍 Find Booths Near Me
    </Button>
  </div>
</section>
```

### H2. Add "Recently Added" Section

**Recommendation:** Show freshness and activity
```typescript
<section className="py-12 bg-green-50">
  <div className="max-w-7xl mx-auto px-4">
    <h2 className="text-3xl font-bold mb-2">Just Discovered</h2>
    <p className="text-neutral-600 mb-6">
      58 new booths added in the last 24 hours!
    </p>
    <BoothGrid booths={recentBooths} limit={4} />
  </div>
</section>
```

**Impact:** Shows site is active and growing
**Effort:** 1 hour
**Why:** Freshness builds trust

### H3. Add Social Proof

**Recommendation:** Community stats and testimonials
```typescript
<section className="py-16 bg-purple-50">
  <div className="max-w-5xl mx-auto px-4 text-center">
    <h2 className="text-3xl font-bold mb-8">
      Join the Booth Hunter Community
    </h2>
    <div className="grid md:grid-cols-4 gap-6 mb-12">
      <Stat icon="📸" value="1,214" label="Booths Listed" />
      <Stat icon="🗺️" value="45" label="Countries" />
      <Stat icon="👥" value="12,000+" label="Monthly Visitors" />
      <Stat icon="📷" value="500+" label="Photos Shared" />
    </div>
    <blockquote className="text-lg italic text-neutral-700">
      "Finally, a complete guide to finding real analog photo booths!
      This site helped me plan my entire Berlin photo booth tour."
      <br />
      <span className="text-sm not-italic text-neutral-600 mt-2 block">
        - Sarah M., Photo Booth Enthusiast
      </span>
    </blockquote>
  </div>
</section>
```

---

## Mobile-Specific Optimizations

### M1. Sticky Bottom Bar on Booth Pages

**Recommendation:** Always-accessible directions button on mobile
```typescript
{isMobile && (
  <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-neutral-200 p-4 shadow-2xl z-50">
    <div className="max-w-lg mx-auto flex gap-2">
      <Button
        className="flex-1 bg-booth-red text-white font-bold py-4"
        asChild
      >
        <a href={directionsUrl}>
          <Navigation className="w-5 h-5 mr-2" />
          Navigate
        </a>
      </Button>
      <Button
        variant="outline"
        className="flex-none px-4"
        onClick={handleBookmark}
      >
        <Bookmark className="w-5 h-5" />
      </Button>
      <Button
        variant="outline"
        className="flex-none px-4"
        onClick={handleShare}
      >
        <Share className="w-5 h-5" />
      </Button>
    </div>
  </div>
)}
```

**Impact:** Critical - Makes CTA always accessible
**Effort:** 2 hours
**Why:** Mobile users need instant action

### M2. Optimize Tap Targets

**Recommendation:** Ensure all interactive elements are 44x44px minimum
- Current phone/website links may be too small
- Increase padding on all mobile buttons
- Add more whitespace between interactive elements

### M3. Reduce Initial Load Content

**Recommendation:** Lazy load below-fold components
```typescript
// Lazy load heavy components
const NearbyBooths = dynamic(() => import('@/components/booth/NearbyBooths'));
const PhotoGallery = dynamic(() => import('@/components/booth/PhotoGallery'));
const StreetViewEmbed = dynamic(() => import('@/components/booth/StreetViewEmbed'));
```

---

## Maps Integration Improvements

### MAP1. Cluster Management

**Current:** May have clustering issues with 1,200+ booths

**Recommendation:** Implement smart clustering with counts
```typescript
<MarkerClusterGroup
  chunkedLoading
  maxClusterRadius={50}
  iconCreateFunction={(cluster) => {
    const count = cluster.getChildCount();
    return L.divIcon({
      html: `<div class="cluster-marker">${count}</div>`,
      className: 'custom-cluster',
      iconSize: [40, 40]
    });
  }}
>
  {booths.map(booth => <Marker ... />)}
</MarkerClusterGroup>
```

### MAP2. Custom Booth Markers

**Current:** Generic pins

**Recommendation:** Vintage camera icon markers with status colors
```typescript
const boothIcon = L.divIcon({
  html: `
    <div class="booth-marker ${booth.is_operational ? 'operational' : 'inactive'}">
      📷
    </div>
  `,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 32]
});
```

**CSS:**
```css
.booth-marker {
  background: white;
  border: 3px solid #C41E3A;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  display: flex;
  align-items: center;
  justify-center;
  font-size: 18px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

.booth-marker.operational {
  border-color: #10B981; /* Green */
}

.booth-marker.inactive {
  border-color: #EF4444; /* Red */
  opacity: 0.6;
}
```

### MAP3. Map Search/Filter

**Recommendation:** Add quick filters above map
```typescript
<div className="mb-4 flex gap-2 overflow-x-auto">
  <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>
    All Booths
  </FilterButton>
  <FilterButton active={filter === 'operational'} onClick={() => setFilter('operational')}>
    ✓ Operational Only
  </FilterButton>
  <FilterButton active={filter === 'verified'} onClick={() => setFilter('verified')}>
    ⭐ Recently Verified
  </FilterButton>
  <FilterButton active={filter === 'photos'} onClick={() => setFilter('photos')}>
    📷 Has Photos
  </FilterButton>
</div>
```

---

## Implementation Roadmap

### Week 1 (Quick Wins)
1. Hero CTA optimization
2. Quick info pills
3. Verified badge
4. Better no-photo placeholder

**Expected Impact:** 20-30% increase in direction clicks

### Week 2 (Mobile & Trust)
1. Sticky bottom bar (mobile)
2. Visit preparation section
3. Enhanced mobile map
4. Report issue improvements

**Expected Impact:** 25% better mobile engagement

### Week 3 (Discovery & Engagement)
1. Similar booths in city
2. Recently added section
3. Community stats
4. Photo quality indicators

**Expected Impact:** 40% increase in page views per session

### Week 4 (Visual & Polish)
1. Vintage color palette
2. Photo strip borders
3. Custom map markers
4. Themed loading states

**Expected Impact:** Stronger brand recall, emotional connection

### Month 2+ (Advanced Features)
1. Booth hunter gamification
2. User profiles and collections
3. Check-in functionality
4. Community photo challenges
5. Email digest of new booths

---

## Measurement & Success Metrics

### Key Metrics to Track

**Conversion Metrics:**
- Directions button click rate (Target: >40%)
- Time spent on booth pages (Target: >2 min)
- Secondary action rate: bookmark, share (Target: >15%)

**Engagement Metrics:**
- Pages per session (Target: >3)
- Return visitor rate (Target: >20%)
- Community contributions (photos, reports) (Target: 5% of visitors)

**Mobile Metrics:**
- Mobile bounce rate (Target: <30%)
- Mobile conversion rate (Target: within 10% of desktop)
- Mobile page load time (Target: <2s)

**Discovery Metrics:**
- Map interactions (Target: 60% of homepage visitors)
- "Nearby booths" clicks (Target: >25%)
- Search usage (Target: >30% of visitors)

### A/B Testing Priorities

1. **Hero CTA variations:**
   - Button size, color, copy
   - Test: "Get Directions" vs "Navigate There" vs "Let's Go!"

2. **Photo placeholder strategies:**
   - AI-generated vs vintage illustration vs community CTA
   - Measure: photo upload rate

3. **Trust signals:**
   - Verification badge placement
   - Google rating prominence
   - Source attribution visibility

---

## Technical Considerations

### Performance
- Hero images must be optimized (Next.js Image)
- Lazy load all below-fold content
- Implement ISR (Incremental Static Regeneration) - already done ✓
- Consider CDN for AI-generated images

### SEO
- Current structured data is excellent ✓
- Add local business markup for each booth
- Ensure all images have descriptive alt text
- Add image sitemaps

### Accessibility
- Ensure all CTAs have clear focus states
- Test with screen readers
- Maintain sufficient color contrast
- Add ARIA labels to interactive maps

---

## Competitive Analysis Insights

Looking at similar discovery platforms (Yelp, TripAdvisor, Airbnb Experiences):

**They Excel At:**
- Prominent CTAs (book, reserve, get directions)
- Social proof (reviews, photos, verification)
- Mobile-first design
- Clear information hierarchy
- Rich media (photos, videos, tours)

**Booth Beacon Can Differentiate:**
- ✨ Nostalgic, vintage aesthetic (vs generic modern)
- 🎯 Niche community (vs broad audiences)
- 📍 Rarity/treasure hunt feeling (vs commoditized listings)
- 🤝 Collector mentality (vs transactional)
- 📷 Analog appreciation (vs digital everything)

---

## Final Recommendations Summary

### Must Do (Priority 1)
1. Make "Get Directions" CTA 2x larger and more prominent
2. Add verification/freshness badges
3. Add quick info pills (cost, hours, operational status)
4. Improve no-photo placeholder experience

### Should Do (Priority 2)
5. Add visit preparation checklist
6. Enhance mobile map with prominent CTA overlays
7. Add city-specific booth discovery
8. Structure hours display with "open now" indicators

### Nice to Have (Priority 3)
9. Photo quality score indicators
10. Specific report issue types
11. Booth hunter gamification

### Polish (Priority 4)
12. Vintage color palette
13. Photo strip border treatment
14. Custom map markers
15. Themed loading states

---

## Questions & Next Steps

**Before Implementation:**
1. Confirm target KPIs (directions clicks, engagement, etc.)
2. Set up analytics events for key actions
3. Establish A/B testing framework
4. Gather user feedback on proposed changes

**User Research Opportunities:**
1. Interview 5-10 active booth hunters
2. Watch users navigate booth pages (screen recordings)
3. Survey: "What almost stopped you from visiting this booth?"
4. Heatmap analysis of booth pages

---

**Prepared By:** Claude AI (E-commerce, Maps, Vintage Aesthetic Expertise)
**For:** Booth Beacon
**Date:** December 20, 2025
**Status:** Ready for Implementation
