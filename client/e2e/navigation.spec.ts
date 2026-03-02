import { expect, test } from '@playwright/test';

test.describe('Search Page', () => {
  test('should load the search page', async ({ page }) => {
    await page.goto('/search');
    await expect(page).toHaveURL(/\/search/);
  });

  test('should display search title or course cards', async ({ page }) => {
    await page.goto('/search');
    await page.waitForLoadState('networkidle');
    // The search page should have a title or course card elements
    const searchTitle = page.locator('[class*="search"]');
    await expect(searchTitle.first()).toBeVisible();
  });

  test('should handle search query parameter', async ({ page }) => {
    await page.goto('/search?id=web-development');
    await expect(page).toHaveURL(/\/search/);
  });
});

test.describe('Navigation', () => {
  test('should have a visible navbar on landing page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const navbar = page.locator('nav');
    await expect(navbar.first()).toBeVisible();
  });

  test('should have a footer on landing page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const footer = page.locator('[class*="footer"]');
    await expect(footer.first()).toBeVisible();
  });

  test('should navigate between pages without errors', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Navigate to search
    await page.goto('/search');
    await expect(page).toHaveURL(/\/search/);
    // Navigate back to landing
    await page.goto('/');
    await expect(page).toHaveURL(/\/$/);
  });
});

test.describe('Checkout Page', () => {
  test('should load checkout page without server error', async ({ page }) => {
    const response = await page.goto(
      '/checkout?step=1&id=test-course&showSignUp=false'
    );
    // Should load without a 500 error
    expect(response?.status()).toBeLessThan(500);
  });
});

test.describe('Protected Routes', () => {
  test('should load student dashboard without server error', async ({
    page,
  }) => {
    const response = await page.goto('/student/courses');
    // Clerk handles auth externally; just ensure no 500
    expect(response?.status()).toBeLessThan(500);
  });

  test('should load teacher dashboard without server error', async ({
    page,
  }) => {
    const response = await page.goto('/teacher/courses');
    expect(response?.status()).toBeLessThan(500);
  });

  test('should load settings page without server error', async ({ page }) => {
    const response = await page.goto('/teacher/settings');
    expect(response?.status()).toBeLessThan(500);
  });
});

test.describe('Accessibility Basics', () => {
  test('should have a lang attribute on html', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBeTruthy();
  });

  test('should have meta viewport tag', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const viewport = await page
      .locator('meta[name="viewport"]')
      .getAttribute('content');
    expect(viewport).toContain('width=');
  });
});
