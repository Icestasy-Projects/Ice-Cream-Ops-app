import { Page } from '@playwright/test';

// Credentials stored in env vars — never hardcode
export const TEST_EMAIL = process.env.TEST_EMAIL || '';
export const TEST_PASSWORD = process.env.TEST_PASSWORD || '';

export async function login(page: Page, email = TEST_EMAIL, password = TEST_PASSWORD) {
  await page.goto('/login');
  await page.getByPlaceholder(/email/i).fill(email);
  await page.getByPlaceholder(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  // Wait for redirect away from /login
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 10_000 });
}
