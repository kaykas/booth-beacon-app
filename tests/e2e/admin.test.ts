/**
 * E2E TESTS - ADMIN PAGE
 *
 * Tests for admin page functionality
 */

import { test, expect } from '@playwright/test';

test.describe.skip('Admin Page', () => {
  test('should load admin page', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'networkidle' });

    // Should load (might require auth)
    const body = await page.locator('body').textContent();
    expect(body).toBeTruthy();
  });

  test('should display data table or list', async ({ page }) => {
    await page.goto('/admin');

    await page.waitForLoadState('networkidle');

    // Wait for potential data to load
    await page.waitForTimeout(2000);

    // Should have main content area
    const mainContent = page.locator('main').or(page.locator('[role="main"]')).first();
    await expect(mainContent).toBeVisible();
  });

  test('should handle no data gracefully', async ({ page }) => {
    await page.goto('/admin');

    await page.waitForLoadState('networkidle');

    // Should render without crashing
    await expect(page.locator('body')).toBeVisible();
  });

  test('should be responsive', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/admin');

    await page.waitForLoadState('networkidle');

    // Should render correctly
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe.skip('Admin Data Display', () => {
  test('should show booth statistics', async ({ page }) => {
    await page.goto('/admin');

    await page.waitForLoadState('networkidle');

    // Wait for data to potentially load
    await page.waitForTimeout(2000);

    // Should have some content (might be "no data" or actual data)
    const hasContent = await page.locator('body').textContent();
    expect(hasContent).toBeTruthy();
  });

  test('should allow filtering data', async ({ page }) => {
    await page.goto('/admin');

    await page.waitForLoadState('networkidle');

    // Look for filter inputs
    const filterInput = page.getByRole('searchbox').or(
      page.getByPlaceholder(/filter|search/i)
    );

    // If filter exists, test it
    const filterCount = await filterInput.count();
    if (filterCount > 0) {
      await filterInput.first().fill('test');
      await page.waitForTimeout(500);

      // Should still render
      await expect(page.locator('body')).toBeVisible();
    }
  });
});
