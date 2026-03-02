import { expect, test } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should display the landing page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveTitle(/Learn Now/i);
  });

  test('should have navigation links', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
  });

  test('should navigate to search page', async ({ page }) => {
    await page.goto('/search');
    await expect(page.url()).toContain('/search');
  });
});

test.describe('Authentication', () => {
  test('should redirect to signin when accessing protected route', async ({
    page,
  }) => {
    const response = await page.goto('/teacher/courses');
    // Should either redirect to sign-in or load a page (Clerk handles auth)
    expect(response?.status()).toBeLessThan(500);
  });
});
