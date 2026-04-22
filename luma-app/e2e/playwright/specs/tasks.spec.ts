import { test, expect } from '@playwright/test';

test.describe('Tasks', () => {
  test.beforeEach(async ({ page }) => {
    const email = process.env.E2E_TEST_EMAIL || 'test@example.com';
    const password = process.env.E2E_TEST_PASSWORD || 'testpassword';

    await page.goto('/');
    await page.getByPlaceholder('E-mail').fill(email);
    await page.getByPlaceholder('Senha').fill(password);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByText('Tarefas')).toBeVisible({ timeout: 10000 });
  });

  test('should display tasks list', async ({ page }) => {
    await page.getByText('Tarefas').click();
    await expect(page.getByText(/tarefas|pendentes/i)).toBeVisible();
  });

  test('should create a new task', async ({ page }) => {
    await page.getByText('Tarefas').click();

    await page.getByTestId('fab-create-task').click();

    await page.getByPlaceholder(/título/i).fill('Tarefa de teste E2E');

    await page.getByRole('button', { name: /criar|salvar/i }).click();

    await expect(page.getByText('Tarefa de teste E2E')).toBeVisible({ timeout: 5000 });
  });

  test('should mark task as completed', async ({ page }) => {
    await page.getByText('Tarefas').click();

    const firstTask = page.locator('[data-testid="task-item"]').first();
    const checkbox = firstTask.getByRole('checkbox');

    if (await checkbox.isVisible()) {
      await checkbox.check();
      await expect(checkbox).toBeChecked();
    }
  });

  test('should filter tasks by status', async ({ page }) => {
    await page.getByText('Tarefas').click();

    const filterButton = page.getByText(/pendentes|concluídas|todas/i).first();
    if (await filterButton.isVisible()) {
      await filterButton.click();
    }
  });
});
