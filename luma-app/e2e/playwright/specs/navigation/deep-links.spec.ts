import { expect, test } from '@playwright/test';

import { ensureAuthenticated, getMissingCredentialsMessage, hasE2ECredentials } from '../helpers/session';

test.describe('Deep links and direct URLs', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasE2ECredentials(), getMissingCredentialsMessage());
    await ensureAuthenticated(page);
  });

  test('abre /tasks diretamente e permanece em área autenticada', async ({ page }) => {
    await page.goto('/tasks');
    await expect(page.locator('body')).toBeVisible();
    await expect(page).not.toHaveURL(/\/landing$/i);
    await expect(page).not.toHaveURL(/\/login$/i);
  });

  test('abre /finances/budget diretamente e mantém back para /finances', async ({ page }) => {
    await page.goto('/finances');
    await page.goto('/finances/budget');
    await expect(page).toHaveURL(/\/finances\/budget$/i);

    await page.goBack();
    await expect(page).toHaveURL(/\/finances$/i);
  });

  test('rota inválida autenticada não deve redirecionar para landing', async ({ page }) => {
    await page.goto('/this-route-does-not-exist');
    await expect(page.locator('body')).toBeVisible();
    await expect(page).not.toHaveURL(/\/landing$/i);
  });
});
