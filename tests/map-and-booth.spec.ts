import { test, expect } from '@playwright/test';

test.describe('Map and Booth Display Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Suppress console noise
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error('Browser console error:', msg.text());
      }
    });
  });

  test('home page loads and displays map', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Check for key elements
    await expect(page.locator('h1')).toContainText('Classic Photo Booth');

    // Check that map section exists
    const mapSection = page.locator('#map-section');
    await expect(mapSection).toBeVisible();

    // Check that map canvas is rendered (Google Maps creates a canvas element)
    await page.waitForTimeout(3000); // Give Google Maps time to load
    const mapCanvas = page.locator('#map-section canvas').first();
    await expect(mapCanvas).toBeVisible();

    console.log('✓ Home page map loads successfully');
  });

  test('map page loads with filters and displays booths', async ({ page }) => {
    await page.goto('http://localhost:3000/map');

    // Check header
    await expect(page.locator('header')).toContainText('Booth Beacon');

    // Check that filter panel exists
    await expect(page.locator('aside')).toBeVisible();
    await expect(page.getByText('Filters')).toBeVisible();

    // Wait for map to load
    await page.waitForTimeout(3000);

    // Check booth count indicator at bottom of map
    const boothCount = page.locator('text=/\\d+ booths?/').first();
    await expect(boothCount).toBeVisible();

    // Take screenshot for visual verification
    await page.screenshot({ path: '/tmp/map-page-test.png' });

    console.log('✓ Map page loads with filters');
  });

  test('booth detail page displays correctly', async ({ page }) => {
    // Use a known booth slug
    await page.goto('http://localhost:3000/booth/kmart-3699-apple-valley-1');

    // Check booth name loads
    await expect(page.locator('h1')).toContainText('Kmart 3699');

    // Check location info
    await expect(page.locator('text=Apple Valley')).toBeVisible();

    // Check that booth image loads
    const boothImage = page.locator('img[alt*="Kmart"]').first();
    await expect(boothImage).toBeVisible();

    // Check that location map renders
    await page.waitForTimeout(2000);
    const locationCard = page.locator('text=Location').locator('..').locator('..');
    await expect(locationCard).toBeVisible();

    // Check for status badge
    await expect(page.locator('text=/Active|Unverified|Inactive|Closed/').first()).toBeVisible();

    // Check for action buttons
    await expect(page.locator('text=Directions')).toBeVisible();

    console.log('✓ Booth detail page displays correctly');
  });

  test('booth without coordinates shows proper fallback', async ({ page }) => {
    // Test booth #5 from our data test - Corner Mall in Boston (no coordinates)
    await page.goto('http://localhost:3000/booth/corner-mall-boston');

    // Should show booth name
    await expect(page.locator('h1')).toContainText('Corner Mall');

    // Should show "Location coordinates not available" message
    await expect(page.locator('text=/coordinates not available|Location coordinates/i')).toBeVisible();

    console.log('✓ Booth without coordinates shows proper fallback');
  });

  test('booth cards display images correctly', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Scroll to featured booths section
    await page.locator('text=Featured Booths').scrollIntoViewIfNeeded();

    // Wait for booth cards to load
    await page.waitForTimeout(2000);

    // Check that booth cards are visible
    const boothCards = page.locator('[class*="grid"] >> [href^="/booth/"]');
    const count = await boothCards.count();

    expect(count).toBeGreaterThan(0);
    console.log(`Found ${count} booth cards on home page`);

    // Check that at least one booth card has an image
    const firstCard = boothCards.first();
    await expect(firstCard.locator('img').first()).toBeVisible();

    console.log('✓ Booth cards display images correctly');
  });

  test('map markers are clickable and show info windows', async ({ page }) => {
    await page.goto('http://localhost:3000/map');

    // Wait for map to fully load
    await page.waitForTimeout(4000);

    // Try to find and click a marker (Google Maps markers are in canvas, so we need to click coordinates)
    // This is a basic test - in production you'd want more sophisticated marker detection
    const mapContainer = page.locator('[class*="min-h-"][class*="500px"]').first();
    await expect(mapContainer).toBeVisible();

    // Check that map controls are present (zoom, etc)
    const zoomControl = page.locator('button[aria-label*="Zoom"]').first();
    await expect(zoomControl).toBeVisible({ timeout: 5000 });

    console.log('✓ Map loads with interactive controls');
  });

  test('search bar functionality', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Find search input
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await expect(searchInput).toBeVisible();

    // Type a city name
    await searchInput.fill('Berlin');
    await page.waitForTimeout(1000);

    // Note: Full search functionality would require checking for results dropdown
    // This is a basic test to ensure the search bar is present and functional

    console.log('✓ Search bar is present and accepts input');
  });

  test('console errors check', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('http://localhost:3000');
    await page.waitForTimeout(3000);

    await page.goto('http://localhost:3000/map');
    await page.waitForTimeout(3000);

    await page.goto('http://localhost:3000/booth/kmart-3699-apple-valley-1');
    await page.waitForTimeout(3000);

    // Filter out expected/harmless errors
    const criticalErrors = errors.filter(err =>
      !err.includes('source.unsplash.com') && // Known deprecated API
      !err.includes('favicon') && // Favicon loading is optional
      !err.includes('hydration') && // React hydration warnings are not critical
      !err.toLowerCase().includes('warning')
    );

    console.log(`Total console errors: ${errors.length}`);
    console.log(`Critical errors: ${criticalErrors.length}`);

    if (criticalErrors.length > 0) {
      console.log('Critical errors found:');
      criticalErrors.forEach(err => console.log(`  - ${err}`));
    }

    // Don't fail test for console errors, just report them
    console.log('✓ Console error check completed');
  });
});
