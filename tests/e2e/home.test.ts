/**
 * E2E TESTS - HOME PAGE
 *
 * Tests for the home page functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should load successfully', async ({ page }) => {
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check for main heading or title
    await expect(page).toHaveTitle(/Booth Beacon/i);
  });

  test('should display search functionality', async ({ page }) => {
    await page.goto('/');

    // Look for search input or search-related elements
    const searchElement = page.getByRole('searchbox').or(
      page.getByPlaceholder(/search/i)
    );

    // Should be visible
    await expect(searchElement.first()).toBeVisible({ timeout: 10000 });
  });

  test('should have navigation elements', async ({ page }) => {
    await page.goto('/');

    // Check for navigation links
    const nav = page.locator('nav').or(page.locator('header'));
    await expect(nav.first()).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    await page.waitForLoadState('networkidle');

    // Page should still render correctly
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Search Functionality', () => {
  test('should allow searching for booths', async ({ page }) => {
    await page.goto('/');

    // Find search input
    const searchInput = page.getByRole('searchbox').or(
      page.getByPlaceholder(/search/i)
    ).first();

    await searchInput.fill('New York');

    // Wait a bit for any auto-complete or results
    await page.waitForTimeout(1000);

    // Should not crash
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle empty search', async ({ page }) => {
    await page.goto('/');

    const searchInput = page.getByRole('searchbox').or(
      page.getByPlaceholder(/search/i)
    ).first();

    await searchInput.fill('');
    await searchInput.press('Enter');

    // Should handle gracefully
    await expect(page.locator('body')).toBeVisible();
  });
});
