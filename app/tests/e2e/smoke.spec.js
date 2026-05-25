import { test, expect } from '@playwright/test';

const requireAuthCredentials = process.env.PLAYWRIGHT_REQUIRE_AUTH_CREDENTIALS === 'true';

const authScenarios = [
  {
    label: 'buyer',
    emailEnv: 'PLAYWRIGHT_BUYER_EMAIL',
    passwordEnv: 'PLAYWRIGHT_BUYER_PASSWORD',
    expectedUrl: /#\/order(?:\?.*)?$/,
    readyLocator: (page) => page.getByRole('heading', { name: /what do you fancy/i }),
    checks: [
      {
        label: 'buyer profile and order history shell renders',
        path: '/order/profile',
        assert: async (page) => {
          await expect(
            page.getByRole('heading', { name: /my orders/i }),
            'business-surface: buyer order history should render after sign-in',
          ).toBeVisible();
          await expect(
            page.getByText(/^account$/i),
            'business-surface: buyer account shell should render after sign-in',
          ).toBeVisible();
        },
      },
    ],
  },
  {
    label: 'seller',
    emailEnv: 'PLAYWRIGHT_SELLER_EMAIL',
    passwordEnv: 'PLAYWRIGHT_SELLER_PASSWORD',
    expectedUrl: /#\/vendor\/dashboard$/,
    readyLocator: (page) => page.getByText(/vendor portal/i),
    checks: [
      {
        label: 'seller inventory shell renders',
        path: '/vendor/products',
        assert: async (page) => {
          await expect(
            page.getByRole('heading', { name: /inventory/i }),
            'business-surface: seller inventory should render for the seeded store',
          ).toBeVisible();
          await expect(
            page.getByRole('button', { name: /add product/i }),
            'business-surface: seller inventory controls should be available',
          ).toBeVisible();
        },
      },
    ],
  },
  {
    label: 'admin',
    emailEnv: 'PLAYWRIGHT_ADMIN_EMAIL',
    passwordEnv: 'PLAYWRIGHT_ADMIN_PASSWORD',
    expectedUrl: /#\/admin\/dashboard$/,
    readyLocator: (page) => page.getByRole('heading', { name: /^dashboard$/i }),
    checks: [
      {
        label: 'admin order operations shell renders',
        path: '/admin/orders',
        assert: async (page) => {
          await expect(
            page.getByRole('heading', { name: /^orders$/i }),
            'business-surface: admin order operations should render after sign-in',
          ).toBeVisible();
        },
      },
      {
        label: 'admin vendor management shell renders',
        path: '/admin/vendors',
        assert: async (page) => {
          await expect(
            page.getByRole('heading', { name: /^vendors$/i }),
            'business-surface: admin vendor management should render after sign-in',
          ).toBeVisible();
          await expect(
            page.getByRole('button', { name: /add vendor store/i }),
            'business-surface: admin vendor management controls should be available',
          ).toBeVisible();
        },
      },
      {
        label: 'admin event setup shell renders',
        path: '/admin/events',
        assert: async (page) => {
          await expect(
            page.getByRole('heading', { name: /event setup/i }),
            'business-surface: admin event setup should render after sign-in',
          ).toBeVisible();
          await expect(page.getByRole('button', { name: /save event copy/i })).toBeVisible();
        },
      },
      {
        label: 'admin settings shell renders',
        path: '/admin/settings',
        assert: async (page) => {
          await expect(
            page.getByRole('heading', { name: /^settings$/i }),
            'business-surface: admin operational settings should render after sign-in',
          ).toBeVisible();
          await expect(page.getByRole('button', { name: /pause checkout/i })).toBeVisible();
        },
      },
    ],
  },
];

function getMissingAuthEnvVars() {
  return authScenarios.flatMap((scenario) => {
    const missing = [];
    if (!process.env[scenario.emailEnv]) missing.push(scenario.emailEnv);
    if (!process.env[scenario.passwordEnv]) missing.push(scenario.passwordEnv);
    return missing;
  });
}

function appPath(path) {
  return path === '/' ? '/' : `/#${path}`;
}

async function signIn(page, email, password) {
  await test.step('routing: open the login page', async () => {
    await page.goto(appPath('/login'));
    await expect(
      page.getByRole('heading', { name: /sign in/i }),
      'routing: /login should render the sign-in form',
    ).toBeVisible();
  });

  await test.step('auth: submit credentials', async () => {
    await page.getByLabel(/email address/i).fill(email);
    await page.getByRole('textbox', { name: /^password$/i }).fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();
  });
}

test.describe('public smoke', () => {
  test('landing page renders primary CTA', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('link', { name: /let's eat/i }),
      'routing: public landing page should render the primary ordering CTA',
    ).toBeVisible();
  });

  test('buyer entry point renders the vendor chooser', async ({ page }) => {
    await page.goto(appPath('/order'));
    await expect(
      page.getByRole('heading', { name: /what do you fancy/i }),
      'business-surface: public buyer vendor chooser should render',
    ).toBeVisible();
  });

  test('protected routes redirect unauthenticated users to login', async ({ page }) => {
    for (const protectedPath of ['/vendor/dashboard', '/admin/orders', '/admin/events', '/admin/settings']) {
      await page.goto(appPath(protectedPath));
      await expect(page, `auth: unauthenticated ${protectedPath} should redirect to login`).toHaveURL(
        /#\/login$/,
      );
      await expect(
        page.getByRole('heading', { name: /sign in/i }),
        'auth: redirected login page should render',
      ).toBeVisible();
    }
  });
});

test.describe('authenticated smoke', () => {
  test.beforeAll(() => {
    if (!requireAuthCredentials) return;

    const missingEnvVars = getMissingAuthEnvVars();
    if (missingEnvVars.length > 0) {
      throw new Error(
        `Authenticated smoke requires these environment variables in CI: ${missingEnvVars.join(', ')}`,
      );
    }
  });

  for (const scenario of authScenarios) {
    test(`${scenario.label} can sign in and reach the expected surface`, async ({ page }) => {
      const email = process.env[scenario.emailEnv];
      const password = process.env[scenario.passwordEnv];

      if (!requireAuthCredentials) {
        test.skip(
          !email || !password,
          `Set ${scenario.emailEnv} and ${scenario.passwordEnv} to enable the ${scenario.label} smoke test.`,
        );
      }

      await signIn(page, email, password);
      await test.step(`routing: ${scenario.label} reaches role home`, async () => {
        await expect(
          page,
          `routing: ${scenario.label} should land on the expected role route`,
        ).toHaveURL(scenario.expectedUrl);
        await expect(
          scenario.readyLocator(page),
          `business-surface: ${scenario.label} role home should render`,
        ).toBeVisible();
      });

      for (const check of scenario.checks) {
        await test.step(check.label, async () => {
          await page.goto(appPath(check.path));
          await check.assert(page);
        });
      }
    });
  }
});
