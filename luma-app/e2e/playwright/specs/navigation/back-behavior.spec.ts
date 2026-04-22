import { expect, test } from '@playwright/test';

import { ensureAuthenticated, getMissingCredentialsMessage, hasE2ECredentials, navigateBack } from '../helpers/session';

test.describe('Back navigation behavior', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasE2ECredentials(), getMissingCredentialsMessage());
    await ensureAuthenticated(page);
  });

  test('voltar de /tasks/:id retorna para /tasks e nunca para /landing', async ({ page }) => {
    await page.goto('/tasks');
    await page.goto('/tasks/non-existing-task-id');

    await navigateBack(page);

    await expect(page).toHaveURL(/\/($|tasks)/i);
    await expect(page).not.toHaveURL(/\/landing$/i);
    await expect(page).not.toHaveURL(/\/login$/i);
  });

  test('voltar de /finances/:id retorna para /finances e nunca para /landing', async ({ page }) => {
    await page.goto('/finances');
    await page.goto('/finances/non-existing-expense-id');

    await navigateBack(page);

    await expect(page).toHaveURL(/\/($|finances)/i);
    await expect(page).not.toHaveURL(/\/landing$/i);
    await expect(page).not.toHaveURL(/\/login$/i);
  });

  test('histórico de /finances -> /finances/budget -> back volta corretamente', async ({ page }) => {
    await page.goto('/finances');
    await page.goto('/finances/budget');
    await expect(page).toHaveURL(/\/finances\/budget$/i);

    await page.goBack();
    await expect(page).toHaveURL(/\/finances$/i);
    await expect(page).not.toHaveURL(/\/landing$/i);
  });

  test('histórico de /finances -> /finances/reports -> back volta corretamente', async ({ page }) => {
    await page.goto('/finances');
    await page.goto('/finances/reports');
    await expect(page).toHaveURL(/\/finances\/reports$/i);

    await page.goBack();
    await expect(page).toHaveURL(/\/finances$/i);
    await expect(page).not.toHaveURL(/\/landing$/i);
  });
});
