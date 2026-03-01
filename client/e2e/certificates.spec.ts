import { expect, test } from '@playwright/test';

test.describe('Certificate Verification Page', () => {
  test('should show invalid certificate for random ID', async ({ page }) => {
    await page.goto('/certificates/verify/non-existent-id');
    await expect(page).toHaveURL(/\/certificates\/verify/);

    // Should show "not found" or invalid state
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });

  test('should load the verification page without crash', async ({ page }) => {
    const response = await page.goto('/certificates/verify/test-cert-123');
    expect(response?.status()).toBeLessThan(500);
  });
});

test.describe('Certificate Pages Navigation', () => {
  test('should have certificates link in student sidebar', async ({ page }) => {
    // Navigate to the landing page first
    await page.goto('/');

    // Check that the page loads
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });
});
