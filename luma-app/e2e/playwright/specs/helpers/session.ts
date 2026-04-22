import { expect, type Page } from '@playwright/test';

const AUTH_URL_PATTERN = /\/(login|register|forgot-password|verify-email|onboarding|tutorial|landing)/i;
const MISSING_CREDS_MESSAGE = 'Defina E2E_TEST_EMAIL e E2E_TEST_PASSWORD para executar cenários autenticados.';

export function hasE2ECredentials(): boolean {
  return Boolean(process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD);
}

export function getMissingCredentialsMessage() {
  return MISSING_CREDS_MESSAGE;
}

export async function loginIfNeeded(page: Page) {
  await page.goto('/login');

  const emailInput = page.getByPlaceholder('E-mail');
  if (await emailInput.isVisible({ timeout: 2500 }).catch(() => false)) {
    const email = process.env.E2E_TEST_EMAIL || '';
    const password = process.env.E2E_TEST_PASSWORD || '';

    await emailInput.fill(email);
    await page.getByPlaceholder('Senha').fill(password);
    await page.getByRole('button', { name: 'Entrar' }).click();
  }

  // Aguarda alguma tela autenticada ficar visível após login/redirect.
  await expect(page.locator('body')).toBeVisible();
}

export async function ensureAuthenticated(page: Page) {
  if (!hasE2ECredentials()) {
    throw new Error(MISSING_CREDS_MESSAGE);
  }

  await page.goto('/');

  if (AUTH_URL_PATTERN.test(page.url())) {
    await loginIfNeeded(page);
  }

  await ensureHouseSelected(page);
  await expect(page).not.toHaveURL(/\/landing$/i);
  await expect(page).not.toHaveURL(/\/login$/i);
}

export async function openTab(page: Page, tab: 'index' | 'tasks' | 'finances' | 'house' | 'luma') {
  const tabTestIds: Record<typeof tab, string> = {
    index: 'tab-index',
    tasks: 'tab-tasks/index',
    finances: 'tab-finances/index',
    house: 'tab-house/index',
    luma: 'tab-luma',
  };

  await page.getByTestId(tabTestIds[tab]).click();
}

export async function navigateBack(page: Page) {
  const backButton = page.getByRole('button', { name: /voltar/i }).first();
  const hasBackButton = await backButton.isVisible({ timeout: 1500 }).catch(() => false);

  if (hasBackButton) {
    await backButton.click();
    return;
  }

  await page.goBack();
}

async function ensureHouseSelected(page: Page) {
  const bodyText = (await page.locator('body').innerText().catch(() => '')).toLowerCase();
  if (!bodyText.includes('selecione uma casa')) {
    return;
  }

  await page.goto('/house');
  await expect(page.locator('body')).toBeVisible();

  // Seleciona a primeira casa listada (texto de papel/admin/membro dentro do card).
  const membershipMeta = page.getByText(/admin ·|membro ·/i).first();
  if (await membershipMeta.isVisible({ timeout: 5000 }).catch(() => false)) {
    await membershipMeta.click();
  }

  await page.goto('/');
}
