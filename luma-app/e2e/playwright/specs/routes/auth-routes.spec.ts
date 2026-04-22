import { expect, test } from '@playwright/test';

const authRoutes = [
  '/login',
  '/register',
  '/forgot-password',
  '/verify-email',
  '/onboarding',
  '/tutorial',
] as const;

test.describe('Auth routes', () => {
  for (const route of authRoutes) {
    test(`rota auth carrega: ${route}`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('body')).not.toContainText(/something went wrong|erro inesperado|500/i);
    });
  }
});
