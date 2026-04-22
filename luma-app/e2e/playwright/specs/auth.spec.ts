import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    await expect(page.getByText('Entrar')).toBeVisible();
    await expect(page.getByPlaceholder('E-mail')).toBeVisible();
    await expect(page.getByPlaceholder('Senha')).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    const email = process.env.E2E_TEST_EMAIL || 'test@example.com';
    const password = process.env.E2E_TEST_PASSWORD || 'testpassword';

    await page.getByPlaceholder('E-mail').fill(email);
    await page.getByPlaceholder('Senha').fill(password);
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page.getByText('Tarefas')).toBeVisible({ timeout: 10000 });
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.getByPlaceholder('E-mail').fill('invalid@test.com');
    await page.getByPlaceholder('Senha').fill('wrongpassword');
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page.getByText(/credenciais|inválido|erro/i)).toBeVisible({ timeout: 5000 });
  });

  test('should show error for empty fields', async ({ page }) => {
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page.getByText(/preencha|obrigatório|campo/i)).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to register page', async ({ page }) => {
    await page.getByText(/criar conta|cadastrar|registrar/i).click();

    await expect(page.getByText(/cadastro|registro|nova conta/i)).toBeVisible();
  });
});
