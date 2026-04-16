import { test, expect } from '@playwright/test';

const authScenarios = [
  {
    label: 'buyer',
    emailEnv: 'PLAYWRIGHT_BUYER_EMAIL',
    passwordEnv: 'PLAYWRIGHT_BUYER_PASSWORD',
    expectedUrl: /#\/order(?:\?.*)?$/,
    readyLocator: (page) => page.getByRole('heading', { name: /choose a vendor/i }),
  },
  {
    label: 'seller',
    emailEnv: 'PLAYWRIGHT_SELLER_EMAIL',
    passwordEnv: 'PLAYWRIGHT_SELLER_PASSWORD',
    expectedUrl: /#\/vendor\/dashboard$/,
    readyLocator: (page) => page.getByText(/vendor dashboard/i),
  },
  {
    label: 'admin',
    emailEnv: 'PLAYWRIGHT_ADMIN_EMAIL',
    passwordEnv: 'PLAYWRIGHT_ADMIN_PASSWORD',
    expectedUrl: /#\/admin\/dashboard$/,
    readyLocator: (page) => page.getByRole('heading', { name: /admin dashboard/i }),
  },
];

function appPath(path) {
  return path === '/' ? '/' : `/#${path}`;
}

async function signIn(page, email, password) {
  await page.goto(appPath('/login'));
  await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
  await page.getByLabel(/email address/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
}

test.describe('public smoke', () => {
  test('landing page renders primary CTA', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /start ordering/i })).toBeVisible();
  });

  test('buyer entry point renders the vendor chooser', async ({ page }) => {
    await page.goto(appPath('/order'));
    await expect(page.getByRole('heading', { name: /choose a vendor/i })).toBeVisible();
  });

  test('protected routes redirect unauthenticated users to login', async ({ page }) => {
    await page.goto(appPath('/vendor/dashboard'));
    await expect(page).toHaveURL(/#\/login$/);
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
  });
});

test.describe('authenticated smoke', () => {
  for (const scenario of authScenarios) {
    test(`${scenario.label} can sign in and reach the expected surface`, async ({ page }) => {
      const email = process.env[scenario.emailEnv];
      const password = process.env[scenario.passwordEnv];

      test.skip(
        !email || !password,
        `Set ${scenario.emailEnv} and ${scenario.passwordEnv} to enable the ${scenario.label} smoke test.`,
      );

      await signIn(page, email, password);
      await expect(page).toHaveURL(scenario.expectedUrl);
      await expect(scenario.readyLocator(page)).toBeVisible();
    });
  }
});
