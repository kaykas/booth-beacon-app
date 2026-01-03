# OG Image Specifications

## Required Files

### 1. og-image.png (1200x630px)
**Purpose:** Open Graph and Twitter Card social sharing image

**Design Requirements:**
- Dimensions: 1200x630px (1.91:1 aspect ratio)
- Format: PNG or JPEG
- File size: < 1MB (ideally < 300KB)
- Safe zone: Keep important content within 1104x576px center area

**Content Suggestions:**
- Booth Beacon logo/brand name prominently displayed
- Tagline: "Find Analog Photo Booths Worldwide"
- Vintage photo booth imagery or photo strip aesthetic
- Warm color palette (primary: #e11d48, secondary: #fbbf24)
- Film grain texture overlay for authenticity

### 2. favicon.ico (32x32px, 16x16px multi-resolution)
**Purpose:** Browser tab icon

**Design Requirements:**
- Format: ICO file with multiple resolutions (16x16, 32x32)
- Simple, recognizable at small sizes
- Based on icon.svg design

### 3. apple-touch-icon.png (180x180px)
**Purpose:** iOS home screen icon

**Design Requirements:**
- Dimensions: 180x180px
- Format: PNG
- No rounded corners (iOS adds them automatically)
- No transparency
- Based on icon.svg design with white or themed background

### 4. icon-192.png and icon-512.png
**Purpose:** PWA icons for Android

**Design Requirements:**
- Dimensions: 192x192px and 512x512px
- Format: PNG
- Transparent or themed background
- Based on icon.svg design

## Quick Generation Options

### Option 1: Use Figma/Canva
1. Create 1200x630 canvas
2. Add Booth Beacon branding
3. Include photo booth imagery
4. Export as PNG at 2x resolution

### Option 2: Use RealFaviconGenerator.net
1. Upload a 512x512 master icon
2. Generates all required formats automatically
3. Download and place in /public directory

### Option 3: Command Line (ImageMagick)
```bash
# Generate from icon.svg
convert -density 300 -background white icon.svg -resize 1200x630 og-image.png
convert -density 300 icon.svg -resize 180x180 apple-touch-icon.png
convert -density 300 icon.svg -resize 192x192 icon-192.png
convert -density 300 icon.svg -resize 512x512 icon-512.png
convert icon.svg -define icon:auto-resize=32,16 favicon.ico
```

## Temporary Solution
Until proper images are created, the application will:
1. Use icon.svg as the primary icon
2. Reference missing og-image.png (will show placeholder in social previews)
3. Use default browser favicon

**Note:** These should be created by a designer for production use.
