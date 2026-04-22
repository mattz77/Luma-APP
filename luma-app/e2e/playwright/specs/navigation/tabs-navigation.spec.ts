import { expect, test } from '@playwright/test';

import { ensureAuthenticated, getMissingCredentialsMessage, hasE2ECredentials } from '../helpers/session';

test.describe('Tabs navigation', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasE2ECredentials(), getMissingCredentialsMessage());
    await ensureAuthenticated(page);
  });

  test('navega entre tabs principais sem cair em landing', async ({ page }) => {
    await page.goto('/tasks');
    await expect(page).toHaveURL(/\/tasks/i);

    await page.goto('/finances');
    await expect(page).toHaveURL(/\/finances/i);

    await page.goto('/house');
    await expect(page).toHaveURL(/\/house/i);

    await page.goto('/luma');
    await expect(page).toHaveURL(/\/luma/i);

    await page.goto('/');
    await expect(page).toHaveURL(/\/$/i);
    await expect(page).not.toHaveURL(/\/landing$/i);
  });

  test('troca de tab preserva histórico para goBack', async ({ page }) => {
    await page.goto('/tasks');
    await expect(page).toHaveURL(/\/tasks/i);

    await page.goto('/finances');
    await expect(page).toHaveURL(/\/finances/i);

    await page.goBack();
    await expect(page).toHaveURL(/\/tasks/i);
    await expect(page).not.toHaveURL(/\/landing$/i);
  });

  test('ao abrir luma a partir de uma tab, voltar retorna para a tab de origem', async ({ page }) => {
    await page.goto('/tasks');
    await expect(page).toHaveURL(/\/tasks$/i);

    await page.goto('/luma');
    await expect(page).toHaveURL(/\/luma$/i);

    await page.goBack();
    await expect(page).toHaveURL(/\/tasks$/i);
    await expect(page).not.toHaveURL(/\/landing$/i);
  });
});
