import { expect, test } from '@playwright/test';

import { ensureAuthenticated, getMissingCredentialsMessage, hasE2ECredentials, navigateBack } from '../helpers/session';

test.describe('Stack navigation (tasks/finances)', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasE2ECredentials(), getMissingCredentialsMessage());
    await ensureAuthenticated(page);
  });

  test('tasks stack: lista -> detalhe -> voltar preserva stack', async ({ page }) => {
    await page.goto('/tasks');
    await page.goto('/tasks/non-existing-task-id');

    await navigateBack(page);
    await expect(page).toHaveURL(/\/($|tasks)/i);
    await expect(page).not.toHaveURL(/\/landing$/i);
    await expect(page).not.toHaveURL(/\/login$/i);
  });

  test('finances stack: lista -> budget -> reports -> back -> back', async ({ page }) => {
    await page.goto('/finances');
    await page.goto('/finances/budget');
    await expect(page).toHaveURL(/\/finances\/budget$/i);

    await page.goto('/finances/reports');
    await expect(page).toHaveURL(/\/finances\/reports$/i);

    await page.goBack();
    await expect(page).toHaveURL(/\/finances\/budget$/i);

    await page.goBack();
    await expect(page).toHaveURL(/\/finances$/i);
    await expect(page).not.toHaveURL(/\/landing$/i);
  });
});
