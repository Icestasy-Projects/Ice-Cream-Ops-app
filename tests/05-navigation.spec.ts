/**
 * Navigation smoke tests — verifies key pages load without JS errors after login.
 */
import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

const PAGES = [
  { path: '/dashboard', heading: /dashboard/i },
  { path: '/formulations', heading: /formulation/i },
  { path: '/dashboards/raw-materials', heading: /rm stock|raw material/i },
  { path: '/dashboards/prep', heading: /prep/i },
  { path: '/dashboards/finished-goods', heading: /finished good|fg/i },
];

test.describe('Page smoke tests (authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  for (const { path, heading } of PAGES) {
    test(`${path} loads without errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', err => errors.push(err.message));
      await page.goto(path);
      // Wait for content to settle
      await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => null);
      // No unhandled JS errors
      expect(errors.filter(e => !e.includes('ResizeObserver'))).toHaveLength(0);
      // Page shows some expected heading/text
      await expect(page.getByText(heading).first()).toBeVisible({ timeout: 10_000 });
    });
  }
});
