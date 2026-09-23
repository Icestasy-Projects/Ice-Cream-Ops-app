/**
 * Auth tests — login page UI, redirect behaviour, sign-out.
 */
import { test, expect } from '@playwright/test';

test.describe('Login page', () => {
  test('renders email + password fields and sign-in button', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('shows error on wrong credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/email/i).fill('wrong@example.com');
    await page.getByPlaceholder(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();
    // Supabase auth-ui renders an error message
    await expect(page.locator('[data-supabase-auth-ui-alert], [role="alert"], .text-red-600, .text-red-500').first()).toBeVisible({ timeout: 8_000 });
  });

  test('unauthenticated user is redirected to /login when accessing protected route', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/\/login/, { timeout: 8_000 });
    await expect(page).toHaveURL(/\/login/);
  });
});
