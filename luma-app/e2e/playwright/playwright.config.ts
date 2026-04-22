import { defineConfig, devices } from '@playwright/test';

const e2ePort = Number(process.env.E2E_WEB_PORT || 8087);
const e2eBaseURL = process.env.E2E_BASE_URL || `http://localhost:${e2ePort}`;

export default defineConfig({
  testDir: './specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: e2eBaseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: `npx expo start --web --port ${e2ePort}`,
    url: e2eBaseURL,
    cwd: '../..',
    reuseExistingServer: !process.env.CI,
    timeout: 300 * 1000,
  },
});
