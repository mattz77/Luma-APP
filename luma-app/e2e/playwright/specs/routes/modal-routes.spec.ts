import { expect, test } from '@playwright/test';

import { ensureAuthenticated, getMissingCredentialsMessage, hasE2ECredentials } from '../helpers/session';

test.describe('Modal routes', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasE2ECredentials(), getMissingCredentialsMessage());
    await ensureAuthenticated(page);
  });

  test('rota modal /placeholder renderiza sem quebrar', async ({ page }) => {
    await page.goto('/placeholder');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('body')).not.toContainText(/something went wrong|erro inesperado|500/i);
  });
});
