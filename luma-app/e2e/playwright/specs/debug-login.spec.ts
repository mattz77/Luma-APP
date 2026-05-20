import { test } from '@playwright/test';

test('verify login works', async ({ page }) => {
  page.on('response', async res => {
    if (res.url().includes('/auth/v1/token')) {
      console.log('Auth token status:', res.status());
      const body = await res.json().catch(() => null);
      if (body) console.log('Token body keys:', Object.keys(body).join(', '));
      if (body?.user) console.log('User email_confirmed_at:', body.user.email_confirmed_at);
    }
    if (res.url().includes('/auth/v1/user')) {
      console.log('User endpoint status:', res.status());
      const body = await res.json().catch(() => null);
      if (body) console.log('User response email_confirmed_at:', body.email_confirmed_at);
    }
  });

  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2_000);

  await page.getByTestId('login-email').click();
  await page.keyboard.type('e2e-test@luma-app.test');
  await page.getByTestId('login-password').click();
  await page.keyboard.type('E2eTest@2026!');
  await page.getByRole('button', { name: 'Entrar' }).click();

  // Wait for login form to disappear
  const loginGone = await page.getByTestId('login-email').waitFor({ state: 'hidden', timeout: 20_000 }).then(() => true).catch(() => false);
  console.log('Login succeeded (form gone):', loginGone);

  await page.screenshot({ path: 'screenshots/verify-login.png', fullPage: true });
  console.log('Final URL:', page.url());
  const body = await page.locator('body').innerText().catch(() => 'err');
  console.log('Body:', body.slice(0, 200));
});
