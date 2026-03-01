import { expect, test } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should display the landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Learning Management/i);
  });

  test('should have navigation links', async ({ page }) => {
    await page.goto('/');
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
    await page.goto('/teacher/courses');
    // Should redirect to sign-in page
    await page.waitForURL(/signin/);
    await expect(page.url()).toContain('signin');
  });
});
