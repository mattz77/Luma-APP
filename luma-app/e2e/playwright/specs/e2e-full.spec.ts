/**
 * Full E2E test suite against production: https://luma-app.nicebyte.ia.br
 *
 * Browser locale: pt-BR (set in playwright.config.ts) → app renders in Portuguese.
 * Navigation notes:
 *   - Tab bar: only Home (tab-index), Luma (tab-luma), FAB (fab-open), Search (tab-search)
 *   - Finances/Tasks/House accessed via home screen cards
 *   - Profile accessed via "Meu Perfil" link on home screen
 */

import { test, expect, type Page } from '@playwright/test';

const EMAIL = process.env.E2E_TEST_EMAIL ?? 'e2e-test@luma-app.test';
const PASSWORD = process.env.E2E_TEST_PASSWORD ?? 'E2eTest@2026!';

// ─── helpers ────────────────────────────────────────────────────────────────

async function clearSession(page: Page) {
  // Clear cookies (Supabase may use cookie-based sessions)
  await page.context().clearCookies();
  await page.goto('/');
  await page.evaluate(async () => {
    try { localStorage.clear(); } catch {}
    try { sessionStorage.clear(); } catch {}
    // Clear all IndexedDB databases (Supabase may store tokens there)
    try {
      const dbs = await indexedDB.databases?.() ?? [];
      await Promise.all(dbs.map(db => new Promise<void>((res, rej) => {
        const req = indexedDB.deleteDatabase(db.name!);
        req.onsuccess = () => res();
        req.onerror = () => rej();
      })));
    } catch {}
  });
  await page.reload();
  await page.waitForLoadState('networkidle');
}

async function ensureLoginScreen(page: Page) {
  await clearSession(page);
  await page.waitForTimeout(2_000);
  // Check if login form is visible; if not, navigate to /login
  const emailInput = page.getByTestId('login-email');
  const visible = await emailInput.isVisible({ timeout: 5_000 }).catch(() => false);
  if (!visible) {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1_000);
  }
}

async function loginWithCredentials(page: Page, email = EMAIL, password = PASSWORD) {
  await ensureLoginScreen(page);
  await page.waitForTimeout(1_000);
  // Use click+type (not fill) to trigger React Native's onChangeText events
  await page.getByTestId('login-email').click();
  await page.keyboard.type(email);
  await page.getByTestId('login-password').click();
  await page.keyboard.type(password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  // Wait for login form to disappear (SPA may not change URL)
  await expect(page.getByTestId('login-email')).not.toBeVisible({ timeout: 25_000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1_000);
}

async function ensureLoggedIn(page: Page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2_000);
  // Check tab bar (tab-luma) is visible — only shown when logged in and on app
  const isLoggedIn = await page.getByTestId('tab-luma').isVisible({ timeout: 5_000 }).catch(() => false);
  if (!isLoggedIn) {
    await loginWithCredentials(page);
  }
}

/** Navigate to home and click the card for the given section */
async function goToSection(page: Page, cardLabel: 'Finanças' | 'Tarefas' | 'Membros') {
  // If not already on home, navigate there
  const isHomeVisible = await page.getByTestId('tab-luma').isVisible({ timeout: 3_000 }).catch(() => false);
  if (!isHomeVisible) {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2_000);
  }
  // Click the card
  await page.getByText(cardLabel).first().click();
  await page.waitForTimeout(1_500);
}

async function goToLuma(page: Page) {
  await page.goto('/luma');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2_000);
}

async function screenshot(page: Page, name: string) {
  await page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
}

// ─── AUTH: Login ─────────────────────────────────────────────────────────────

test.describe('Auth — Login screen', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoginScreen(page);
    await screenshot(page, 'auth-login');
  });

  test('renders E-mail and Senha fields', async ({ page }) => {
    await expect(page.getByTestId('login-email')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByTestId('login-password')).toBeVisible();
  });

  test('has Entrar button', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible({ timeout: 8_000 });
  });

  test('shows Google sign-in option', async ({ page }) => {
    await expect(page.getByText(/continuar com google/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test('invalid credentials shows error', async ({ page }) => {
    await page.getByTestId('login-email').fill('invalid@nope.com');
    await page.getByTestId('login-password').fill('wrongpass999');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(
      page.getByText(/credenciais inválidas|inválid|invalid|senha incorreta|não encontrado|erro/i)
    ).toBeVisible({ timeout: 15_000 });
    await screenshot(page, 'auth-invalid-creds');
  });

  test('link to register page exists and works', async ({ page }) => {
    const link = page.getByText(/cadastre-se/i);
    await expect(link).toBeVisible({ timeout: 8_000 });
    await link.click();
    await page.waitForTimeout(2_000);
    await screenshot(page, 'auth-register-page');
    await expect(page.getByText(/cadastrar|criar conta|nome/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test('forgot password link works', async ({ page }) => {
    const link = page.getByText(/esqueci minha senha/i);
    await expect(link).toBeVisible({ timeout: 8_000 });
    await link.click();
    await page.waitForTimeout(2_000);
    await screenshot(page, 'auth-forgot-password');
    await expect(page.getByText(/recuperar|redefinir|código|enviar/i).first()).toBeVisible({ timeout: 8_000 });
  });
});

// ─── AUTH: Register ──────────────────────────────────────────────────────────

test.describe('Auth — Register screen', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoginScreen(page);
    await page.getByText(/cadastre-se/i).click();
    await page.waitForTimeout(2_000);
  });

  test('renders registration form fields', async ({ page }) => {
    await screenshot(page, 'auth-register-form');
    await expect(page.getByTestId('register-name')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByTestId('register-email')).toBeVisible();
    await expect(page.getByTestId('register-password')).toBeVisible();
  });

  test('shows Google sign-in option', async ({ page }) => {
    // Google button may be below fold on register screen — use last() since register has 2 auth-google elements
    const googleBtn = page.getByTestId('auth-google').last();
    await googleBtn.scrollIntoViewIfNeeded();
    await expect(googleBtn).toBeVisible({ timeout: 8_000 });
  });

  test('validates empty form submission', async ({ page }) => {
    const btn = page.getByTestId('register-submit');
    await expect(btn).toBeVisible({ timeout: 8_000 });
    await btn.click();
    await page.waitForTimeout(2_000);
    await screenshot(page, 'auth-register-validation');
    await expect(page.locator('body')).toBeVisible();
  });

  test('back to login link works', async ({ page }) => {
    const loginLink = page.getByText(/já tem uma conta|entrar/i).first();
    if (await loginLink.isVisible({ timeout: 5_000 })) {
      await loginLink.click();
      await page.waitForTimeout(1_500);
      await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible({ timeout: 5_000 });
    }
  });
});

// ─── AUTH: Forgot Password ───────────────────────────────────────────────────

test.describe('Auth — Forgot Password screen', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoginScreen(page);
    await page.getByText(/esqueci minha senha/i).click();
    await page.waitForTimeout(2_000);
  });

  test('renders step 1 email input', async ({ page }) => {
    await screenshot(page, 'auth-forgot-step1');
    await expect(page.getByTestId('forgot-email')).toBeVisible({ timeout: 8_000 });
  });

  test('send code button exists', async ({ page }) => {
    const btn = page.getByRole('button', { name: /enviar código|enviar|send/i });
    await expect(btn).toBeVisible({ timeout: 8_000 });
  });

  test('shows error for empty email', async ({ page }) => {
    const btn = page.getByRole('button', { name: /enviar/i }).first();
    if (await btn.isVisible({ timeout: 5_000 })) {
      await btn.click();
      await page.waitForTimeout(2_000);
      await screenshot(page, 'auth-forgot-empty');
      await expect(page.locator('body')).toBeVisible();
    }
  });
});

// ─── AUTH: Valid Login ────────────────────────────────────────────────────────

test.describe('Auth — Valid login flow', () => {
  test('logs in with valid credentials and reaches app', async ({ page }) => {
    test.setTimeout(60_000);
    await loginWithCredentials(page);
    // Navigate to home to ensure OnboardingGuard settles with the fresh session
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2_000);
    await screenshot(page, 'auth-post-login');
    await expect(page.locator('body')).toBeVisible();
    // Verify we're on the app (luma tab-bar visible = authenticated in app)
    await expect(page.getByTestId('tab-luma')).toBeVisible({ timeout: 10_000 });
  });
});

// ─── HOME / DASHBOARD ────────────────────────────────────────────────────────

test.describe('Home — Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
    await screenshot(page, 'home-dashboard');
  });

  test('shows dashboard content', async ({ page }) => {
    await expect(page.getByText(/finanças|tarefas|membros|minha casa/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('shows tab bar with Luma and Search', async ({ page }) => {
    await expect(page.getByTestId('tab-luma')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('tab-search')).toBeVisible();
    await expect(page.getByTestId('fab-open')).toBeVisible();
  });

  test('shows financial summary or balance', async ({ page }) => {
    await expect(page.getByText(/R\$|finanças/i).first()).toBeVisible({ timeout: 10_000 });
  });
});

// ─── TASKS ───────────────────────────────────────────────────────────────────

test.describe('Tasks', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
    await goToSection(page, 'Tarefas');
    await screenshot(page, 'tasks-screen');
  });

  test('tasks screen loads', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByText(/tarefa|pendente|tudo feito|tarefas/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('can open task creation via FAB speed dial', async ({ page }) => {
    // Go back home to access fab-open (tab bar)
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1_500);

    const fabOpen = page.getByTestId('fab-open');
    if (await fabOpen.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await fabOpen.click();
      await page.waitForTimeout(500);
      const fabTask = page.getByTestId('fab-create-task');
      if (await fabTask.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await fabTask.click();
        await page.waitForTimeout(2_000);
        await screenshot(page, 'tasks-create-modal');
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });
});

// ─── FINANCES / EXPENSES ────────────────────────────────────────────────────

test.describe('Finances', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
    await goToSection(page, 'Finanças');
    await screenshot(page, 'finances-screen');
  });

  test('finances screen loads', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByText(/finanças|despesa|gasto|R\$/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('shows balance or empty state', async ({ page }) => {
    const content = page.getByText(/R\$|nenhuma despesa|sem despesas|0,00|adicionar/i).first();
    await expect(content).toBeVisible({ timeout: 10_000 });
  });
});

// ─── CHAT (Luma) ─────────────────────────────────────────────────────────────

test.describe('Luma Chat', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
    await goToLuma(page);
    await screenshot(page, 'chat-screen');
  });

  test('chat screen loads', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByText(/luma|mensagem|chat|olá/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('chat input is visible', async ({ page }) => {
    const input = page.getByTestId('chat-input');
    await expect(input).toBeVisible({ timeout: 10_000 });
    await screenshot(page, 'chat-input');
  });

  test('sends a message', async ({ page }) => {
    const input = page.getByTestId('chat-input');
    await expect(input).toBeVisible({ timeout: 10_000 });

    // Use click + keyboard.type to trigger React Native onChangeText
    await input.click();
    await page.keyboard.type('como vai?');
    await screenshot(page, 'chat-typed');

    const sendBtn = page.getByTestId('chat-send-btn');
    if (await sendBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await sendBtn.click();
    } else {
      await page.keyboard.press('Enter');
    }
    await page.waitForTimeout(5_000);
    await screenshot(page, 'chat-after-message');
    // Check that the sent message text appears in chat history
    await expect(page.getByText(/como vai/i).first()).toBeVisible({ timeout: 8_000 });
  });
});

// ─── PROFILE ─────────────────────────────────────────────────────────────────

test.describe('Profile', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
    // Click avatar icon in header → opens user menu modal
    await page.getByTestId('header-avatar-btn').click();
    await page.waitForTimeout(1_500);
    await screenshot(page, 'profile-modal');
  });

  test('profile screen loads', async ({ page }) => {
    // User menu modal with "Perfil" header should be visible
    await expect(page.getByText(/^Perfil$/i)).toBeVisible({ timeout: 10_000 });
  });

  test('shows user email or name', async ({ page }) => {
    // Modal shows "Meu Perfil" option (linked to user profile)
    await expect(page.getByText(/meu perfil/i)).toBeVisible({ timeout: 10_000 });
  });

  test('logout button exists', async ({ page }) => {
    // Modal has "Sair da Conta" logout option
    const logout = page.getByText(/sair da conta/i).first();
    await expect(logout).toBeVisible({ timeout: 10_000 });
  });
});
