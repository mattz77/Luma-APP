import { expect, test } from '@playwright/test';

import { ensureAuthenticated, getMissingCredentialsMessage, hasE2ECredentials, navigateBack } from '../helpers/session';

const protectedRoutes = [
  '/',
  '/tasks',
  '/finances',
  '/finances/budget',
  '/finances/reports',
  '/luma',
  '/house',
  '/profile',
  '/notifications',
  '/activity-history',
] as const;

test.describe('Protected routes', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasE2ECredentials(), getMissingCredentialsMessage());
    await ensureAuthenticated(page);
  });

  for (const route of protectedRoutes) {
    test(`rota protegida carrega: ${route}`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator('body')).toBeVisible();
      await expect(page).not.toHaveURL(/\/landing$/i);
      await expect(page).not.toHaveURL(/\/login$/i);
      await expect(page.locator('body')).not.toContainText(/something went wrong|erro inesperado|500/i);
    });
  }

  test('rota dinâmica de tasks exibe fallback e mantém comportamento de voltar', async ({ page }) => {
    await page.goto('/tasks');
    await page.goto('/tasks/non-existing-task-id');
    await navigateBack(page);
    await expect(page).toHaveURL(/\/($|tasks)/i);
    await expect(page).not.toHaveURL(/\/landing$/i);
    await expect(page).not.toHaveURL(/\/login$/i);
  });

  test('rota dinâmica de finances exibe fallback e mantém comportamento de voltar', async ({ page }) => {
    await page.goto('/finances');
    await page.goto('/finances/non-existing-expense-id');
    await navigateBack(page);
    await expect(page).toHaveURL(/\/($|finances)/i);
    await expect(page).not.toHaveURL(/\/landing$/i);
    await expect(page).not.toHaveURL(/\/login$/i);
  });
});
