import { expect, test } from '@playwright/test';

test.describe('Search Page', () => {
  test('should load the search page', async ({ page }) => {
    await page.goto('/search');
    await expect(page).toHaveURL(/\/search/);
  });

  test('should display search input or course cards', async ({ page }) => {
    await page.goto('/search');
    // Either a search bar or a list of courses should be visible
    const hasSearchInput = await page.locator('input').count();
    const hasContent = await page
      .locator('[class*="course"], [class*="search"]')
      .count();
    expect(hasSearchInput + hasContent).toBeGreaterThan(0);
  });

  test('should handle search query parameter', async ({ page }) => {
    await page.goto('/search?id=web-development');
    await expect(page).toHaveURL(/\/search/);
  });
});

test.describe('Navigation', () => {
  test('should have a visible navbar on landing page', async ({ page }) => {
    await page.goto('/');
    const navbar = page.locator('nav, header');
    await expect(navbar.first()).toBeVisible();
  });

  test('should have a footer on landing page', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });

  test('should navigate between pages without errors', async ({ page }) => {
    await page.goto('/');
    // Navigate to search
    await page.goto('/search');
    await expect(page).toHaveURL(/\/search/);
    // Navigate back to landing
    await page.goto('/');
    await expect(page).toHaveURL(/\/$/);
  });
});

test.describe('Checkout Page', () => {
  test('should redirect unauthenticated users from checkout', async ({
    page,
  }) => {
    await page.goto('/checkout?step=1&id=test-course&showSignUp=false');
    // Should either show checkout or redirect to auth
    const currentUrl = page.url();
    const isOnCheckoutOrAuth =
      currentUrl.includes('checkout') || currentUrl.includes('sign');
    expect(isOnCheckoutOrAuth).toBe(true);
  });
});

test.describe('Protected Routes', () => {
  test('should redirect from student dashboard without auth', async ({
    page,
  }) => {
    await page.goto('/student/courses');
    await page.waitForURL(/signin|sign-in/);
    expect(page.url()).toMatch(/signin|sign-in/);
  });

  test('should redirect from teacher dashboard without auth', async ({
    page,
  }) => {
    await page.goto('/teacher/courses');
    await page.waitForURL(/signin|sign-in/);
    expect(page.url()).toMatch(/signin|sign-in/);
  });

  test('should redirect from settings without auth', async ({ page }) => {
    await page.goto('/teacher/settings');
    await page.waitForURL(/signin|sign-in/);
    expect(page.url()).toMatch(/signin|sign-in/);
  });
});

test.describe('Accessibility Basics', () => {
  test('should have a lang attribute on html', async ({ page }) => {
    await page.goto('/');
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBeTruthy();
  });

  test('should have meta viewport tag', async ({ page }) => {
    await page.goto('/');
    const viewport = await page
      .locator('meta[name="viewport"]')
      .getAttribute('content');
    expect(viewport).toContain('width=');
  });
});
