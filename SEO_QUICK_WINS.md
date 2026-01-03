# SEO Quick Wins - Action Items

This document contains immediate action items to complete the SEO optimization.

---

## 🎨 1. Create Production Images (15-30 minutes)

### Option A: Using a Designer (Recommended)
Send `public/OG_IMAGE_SPECS.md` to your designer and request:
- og-image.png (1200x630px)
- favicon.ico (32x32, 16x16)
- apple-touch-icon.png (180x180px)
- icon-192.png (192x192px)
- icon-512.png (512x512px)

### Option B: Quick DIY with Canva
1. Go to Canva.com
2. Create custom size: 1200x630px
3. Add Booth Beacon branding
4. Include text: "Find Analog Photo Booths Worldwide"
5. Download as PNG
6. Save as `public/og-image.png`

### Option C: Use icon.svg to Generate (If you have ImageMagick)
```bash
cd public

# Generate OG image (needs background)
convert -size 1200x630 xc:'#e11d48' \
  -gravity center icon.svg -composite \
  og-image.png

# Generate favicons
convert icon.svg -resize 180x180 apple-touch-icon.png
convert icon.svg -resize 192x192 icon-192.png
convert icon.svg -resize 512x512 icon-512.png
convert icon.svg -define icon:auto-resize=32,16 favicon.ico
```

### Option D: Use RealFaviconGenerator.net (Easiest)
1. Go to https://realfavicongenerator.net/
2. Upload `public/icon.svg`
3. Customize colors/style
4. Download favicon package
5. Extract all files to `public/` directory

---

## 🔍 2. Add Google Search Console Verification (5 minutes)

### Step 1: Get Verification Code
1. Go to https://search.google.com/search-console
2. Add property: `boothbeacon.org`
3. Choose "HTML tag" method
4. Copy the verification code (format: `google-site-verification=XXXXXXXX`)

### Step 2: Add to Environment
Add to `.env.local`:
```bash
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=YOUR_CODE_HERE
```

### Step 3: Deploy & Verify
```bash
npm run build
# Deploy to Vercel
vercel --prod
# Go back to Search Console and click "Verify"
```

---

## 📊 3. Submit Sitemap to Google (2 minutes)

Once Search Console is verified:
1. In Search Console, go to "Sitemaps" (left sidebar)
2. Enter: `sitemap.xml`
3. Click "Submit"

Google will now automatically discover and index all pages.

---

## 📱 4. Test Your SEO (10 minutes)

### Test Open Graph Tags
```bash
# Preview how your site looks when shared
https://www.opengraph.xyz/url/https://boothbeacon.org/
```

Or use:
- Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
- Twitter Card Validator: https://cards-dev.twitter.com/validator
- LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/

### Test Schema Markup
```bash
# Validate structured data
https://validator.schema.org/
# Test URL: https://boothbeacon.org/
```

### Test Mobile Friendliness
```bash
# Google Mobile-Friendly Test
https://search.google.com/test/mobile-friendly?url=https://boothbeacon.org/
```

### Test Core Web Vitals
```bash
# Google PageSpeed Insights
https://pagespeed.web.dev/analysis?url=https://boothbeacon.org/
```

---

## ✅ Verification Checklist

Once you've completed the above, verify:

- [ ] `public/og-image.png` exists and is 1200x630px
- [ ] `public/favicon.ico` exists
- [ ] `public/apple-touch-icon.png` exists
- [ ] `public/icon-192.png` and `public/icon-512.png` exist
- [ ] `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` set in `.env.local`
- [ ] Deployed to production
- [ ] Google Search Console verified
- [ ] Sitemap submitted
- [ ] Open Graph preview looks good on social media debuggers
- [ ] PageSpeed Insights score is 90+ (mobile and desktop)

---

## 🚀 Expected Results

### Within 24 Hours
- Social media previews show proper images and descriptions
- Google Search Console shows verified status

### Within 1 Week
- Sitemap fully indexed (check Coverage report in Search Console)
- City and booth pages start appearing in search results

### Within 1 Month
- Increased impressions for location-based queries
- Better click-through rates from search results
- Core Web Vitals data appears in Search Console

### Within 3 Months
- 30-50% increase in organic traffic
- Ranking for "analog photo booth [city]" queries
- Featured snippets for booth-related questions

---

## 💡 Pro Tips

1. **Monitor Weekly** - Check Search Console every week for the first month
2. **Track Top Queries** - See what people search for and optimize content
3. **Fix Coverage Issues** - Address any indexing errors immediately
4. **Update Content** - Add new booths regularly to keep site fresh
5. **Build Backlinks** - Reach out to vintage photography blogs for links

---

## 🆘 Troubleshooting

### "OG image not showing on social media"
- Clear cache on social media debugger tool
- Wait 24 hours for CDN propagation
- Verify image is accessible: `https://boothbeacon.org/og-image.png`

### "Sitemap not found"
- Check that build completed successfully
- Verify sitemap exists: `https://boothbeacon.org/sitemap.xml`
- Redeploy to production

### "Core Web Vitals score dropped"
- Check for new third-party scripts
- Verify image optimization still working
- Review Vercel Analytics for performance regression

---

## 📞 Need Help?

- SEO Documentation: `SEO_AUDIT_OPTIMIZATION_SUMMARY.md`
- Image Specs: `public/OG_IMAGE_SPECS.md`
- Technical Issues: Check Next.js docs for metadata/sitemap

---

**Time to Complete:** 30-45 minutes total
**Difficulty:** Easy (mostly copy-paste and clicking)
**Impact:** High (essential for search visibility)
