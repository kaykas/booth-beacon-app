#!/usr/bin/env node

/**
 * Generate all required SEO and PWA images for Booth Beacon
 * Uses sharp library to create images programmatically
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Configuration
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const ICON_SVG_PATH = path.join(PUBLIC_DIR, 'icon.svg');

// Brand colors
const COLORS = {
  primary: '#e11d48',    // Rose red
  secondary: '#fbbf24',  // Amber yellow
  white: '#ffffff',
  background: '#1a1a1a'
};

/**
 * Generate OG Image (1200x630px)
 * Open Graph social sharing image with brand elements
 */
async function generateOGImage() {
  console.log('Generating og-image.png (1200x630px)...');

  const width = 1200;
  const height = 630;

  // Create SVG for OG image with photo booth aesthetic
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <!-- Gradient background -->
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${COLORS.primary};stop-opacity:1" />
          <stop offset="100%" style="stop-color:#9f1239;stop-opacity:1" />
        </linearGradient>

        <!-- Film grain texture -->
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch"/>
          <feColorMatrix type="saturate" values="0"/>
          <feBlend mode="multiply" in="SourceGraphic"/>
        </filter>
      </defs>

      <!-- Background -->
      <rect width="${width}" height="${height}" fill="url(#bgGrad)"/>

      <!-- Film grain overlay -->
      <rect width="${width}" height="${height}" fill="white" opacity="0.03" filter="url(#noise)"/>

      <!-- Photo strip frame (decorative) -->
      <rect x="80" y="100" width="280" height="430" rx="8" fill="white" opacity="0.15"/>

      <!-- Large camera icon -->
      <g transform="translate(140, 220)">
        <!-- Camera body -->
        <rect x="0" y="0" width="160" height="120" rx="8" fill="white" opacity="0.95"/>
        <!-- Lens -->
        <circle cx="80" cy="60" r="35" fill="${COLORS.primary}"/>
        <circle cx="80" cy="60" r="25" fill="white"/>
        <circle cx="80" cy="60" r="15" fill="${COLORS.primary}"/>
        <!-- Flash -->
        <circle cx="130" cy="25" r="12" fill="${COLORS.secondary}"/>
      </g>

      <!-- Main text -->
      <text x="450" y="240" font-family="Arial, sans-serif" font-size="96" font-weight="bold" fill="white">
        Booth Beacon
      </text>

      <!-- Tagline -->
      <text x="450" y="320" font-family="Arial, sans-serif" font-size="42" fill="white" opacity="0.9">
        Find Analog Photo Booths
      </text>
      <text x="450" y="380" font-family="Arial, sans-serif" font-size="42" fill="white" opacity="0.9">
        Worldwide
      </text>

      <!-- Photo strip decorations -->
      <g opacity="0.3">
        <rect x="450" y="420" width="120" height="140" rx="4" fill="white"/>
        <line x1="450" y1="467" x2="570" y2="467" stroke="${COLORS.primary}" stroke-width="2"/>
        <line x1="450" y1="513" x2="570" y2="513" stroke="${COLORS.primary}" stroke-width="2"/>

        <rect x="590" y="420" width="120" height="140" rx="4" fill="white"/>
        <line x1="590" y1="467" x2="710" y2="467" stroke="${COLORS.primary}" stroke-width="2"/>
        <line x1="590" y1="513" x2="710" y2="513" stroke="${COLORS.primary}" stroke-width="2"/>

        <rect x="730" y="420" width="120" height="140" rx="4" fill="white"/>
        <line x1="730" y1="467" x2="850" y2="467" stroke="${COLORS.primary}" stroke-width="2"/>
        <line x1="730" y1="513" x2="850" y2="513" stroke="${COLORS.primary}" stroke-width="2"/>
      </g>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(PUBLIC_DIR, 'og-image.png'));

  console.log('✓ og-image.png created');
}

/**
 * Generate Apple Touch Icon (180x180px)
 * iOS home screen icon
 */
async function generateAppleTouchIcon() {
  console.log('Generating apple-touch-icon.png (180x180px)...');

  // Read and resize the icon SVG
  const iconSvg = fs.readFileSync(ICON_SVG_PATH, 'utf8');

  await sharp(Buffer.from(iconSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(PUBLIC_DIR, 'apple-touch-icon.png'));

  console.log('✓ apple-touch-icon.png created');
}

/**
 * Generate PWA Icons (192x192px and 512x512px)
 * Android home screen and splash screen icons
 */
async function generatePWAIcons() {
  console.log('Generating icon-192.png (192x192px)...');

  const iconSvg = fs.readFileSync(ICON_SVG_PATH, 'utf8');

  // 192x192 icon
  await sharp(Buffer.from(iconSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(PUBLIC_DIR, 'icon-192.png'));

  console.log('✓ icon-192.png created');

  console.log('Generating icon-512.png (512x512px)...');

  // 512x512 icon
  await sharp(Buffer.from(iconSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(PUBLIC_DIR, 'icon-512.png'));

  console.log('✓ icon-512.png created');
}

/**
 * Generate Favicon (32x32px and 16x16px in ICO format)
 * Browser tab icon
 */
async function generateFavicon() {
  console.log('Generating favicon.ico (32x32px, 16x16px)...');

  const iconSvg = fs.readFileSync(ICON_SVG_PATH, 'utf8');

  // Sharp doesn't support ICO format directly, so we'll create a 32x32 PNG
  // and rely on browsers to use it as favicon
  await sharp(Buffer.from(iconSvg))
    .resize(32, 32)
    .png()
    .toFile(path.join(PUBLIC_DIR, 'favicon-32x32.png'));

  console.log('✓ favicon-32x32.png created (use as fallback)');

  // For the actual ICO file, we need to create a multi-resolution ICO
  // This requires a separate library. For now, we'll create both sizes as PNG
  // and note that a proper ICO converter should be used in production
  await sharp(Buffer.from(iconSvg))
    .resize(16, 16)
    .png()
    .toFile(path.join(PUBLIC_DIR, 'favicon-16x16.png'));

  console.log('✓ favicon-16x16.png created');
  console.log('⚠ Note: For production, convert these PNGs to a multi-resolution .ico file');
  console.log('  You can use: https://www.icoconverter.com/ or imagemagick');
}

/**
 * Verify all generated images
 */
async function verifyImages() {
  console.log('\n--- Verification ---');

  const requiredFiles = [
    { name: 'og-image.png', width: 1200, height: 630 },
    { name: 'apple-touch-icon.png', width: 180, height: 180 },
    { name: 'icon-192.png', width: 192, height: 192 },
    { name: 'icon-512.png', width: 512, height: 512 },
    { name: 'favicon-32x32.png', width: 32, height: 32 },
    { name: 'favicon-16x16.png', width: 16, height: 16 }
  ];

  for (const file of requiredFiles) {
    const filePath = path.join(PUBLIC_DIR, file.name);

    if (!fs.existsSync(filePath)) {
      console.log(`✗ ${file.name} - NOT FOUND`);
      continue;
    }

    const metadata = await sharp(filePath).metadata();
    const sizeOK = metadata.width === file.width && metadata.height === file.height;
    const status = sizeOK ? '✓' : '✗';

    console.log(`${status} ${file.name} - ${metadata.width}x${metadata.height}px (${Math.round(fs.statSync(filePath).size / 1024)}KB)`);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('=== Booth Beacon Image Generator ===\n');

  try {
    // Generate all images
    await generateOGImage();
    await generateAppleTouchIcon();
    await generatePWAIcons();
    await generateFavicon();

    // Verify results
    await verifyImages();

    console.log('\n✓ All images generated successfully!');
    console.log('\nNext steps:');
    console.log('1. Convert favicon PNGs to a multi-resolution .ico file (optional)');
    console.log('2. Update your HTML meta tags to reference these images');
    console.log('3. Test social sharing previews with https://www.opengraph.xyz/');

  } catch (error) {
    console.error('Error generating images:', error);
    process.exit(1);
  }
}

main();
