/**
 * Formulations (Mix Sheets) page tests.
 *
 * Covers the core work done in this session:
 *  - 74 prep_products visible
 *  - Recipe badges (mix / topping) render for flavours that have ingredients
 *  - "No recipe" badge only for truly empty flavours
 *  - Expand / collapse card reveals ingredient list
 *  - Search filter works
 *  - Purpose values are lowercase (so mix/topping badges appear)
 */
import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

// These three legitimately have no cost-sheet data yet
const KNOWN_EMPTY_FLAVOURS = ['Dakshin Laddoo', 'Pinni', 'Shahi Sevaiya'];

// Spot-check: a few flavours that definitely have recipes
const FLAVOURS_WITH_RECIPES = [
  'Aale Paak',
  'After Hours',
  'French Vanilla',
  'Salted Caramel',
  'Kashmiri Kesar',
];

test.describe('Formulations page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/formulations');
    await page.waitForSelector('text=flavours', { timeout: 15_000 });
  });

  test('shows exactly 74 flavours', async ({ page }) => {
    // The count badge reads "N of 74 flavours"
    const countText = await page.locator('p.text-xs.text-gray-400').first().textContent();
    expect(countText).toMatch(/74 flavours/);
  });

  test('does not show more than 3 "No recipe" badges', async ({ page }) => {
    const noRecipeBadges = page.locator('text=No recipe');
    const count = await noRecipeBadges.count();
    // Only Dakshin Laddoo, Pinni, Shahi Sevaiya should be empty
    expect(count).toBeLessThanOrEqual(KNOWN_EMPTY_FLAVOURS.length);
  });

  for (const flavour of FLAVOURS_WITH_RECIPES) {
    test(`"${flavour}" shows a mix badge`, async ({ page }) => {
      // Filter by flavour name for speed
      await page.getByPlaceholder(/search flavour/i).fill(flavour);
      await expect(page.locator(`text=${flavour}`).first()).toBeVisible();
      // The card for this flavour should have a mix badge (Beaker icon + "mix" text)
      const card = page.locator(`text=${flavour}`).locator('..').locator('..');
      await expect(card.locator('text=/\\d+ mix/')).toBeVisible({ timeout: 5_000 });
    });
  }

  test('expanding a card reveals ingredient rows', async ({ page }) => {
    // Click the first card that has a mix badge
    const firstMixBadge = page.locator('text=/\\d+ mix/').first();
    await firstMixBadge.locator('../../..').click();
    // Ingredient row: qty number + unit text inside the expanded section
    await expect(page.locator('.bg-purple-50').first()).toBeVisible({ timeout: 5_000 });
    // Should contain at least one ingredient row
    await expect(page.locator('.bg-purple-50 .bg-white').first()).toBeVisible();
  });

  test('clicking an expanded card collapses it', async ({ page }) => {
    const card = page.locator('.rounded-2xl.border').first();
    await card.locator('button').click();
    await expect(page.locator('.bg-purple-50').first()).toBeVisible({ timeout: 5_000 });
    // Click again to collapse
    await card.locator('button').click();
    await expect(page.locator('.bg-purple-50')).toHaveCount(0, { timeout: 3_000 });
  });

  test('search filters the list', async ({ page }) => {
    await page.getByPlaceholder(/search flavour/i).fill('mango');
    const countText = await page.locator('p.text-xs.text-gray-400').first().textContent();
    expect(countText).toMatch(/^\d+ of 74/);
    const shownCount = parseInt(countText!.match(/^(\d+)/)![1]);
    // "Mango Basil", "Mango Mania (FD)", "Signature Mango (Aurum)", "Vegan Mango" = 4 results
    expect(shownCount).toBeGreaterThanOrEqual(1);
    expect(shownCount).toBeLessThan(74);
  });

  test('search with no match shows empty state', async ({ page }) => {
    await page.getByPlaceholder(/search flavour/i).fill('xyznotaflavour');
    await expect(page.locator('text=No formulations found')).toBeVisible({ timeout: 5_000 });
  });
});
