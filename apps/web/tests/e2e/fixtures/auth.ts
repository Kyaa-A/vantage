// 🔐 Authentication Test Fixtures
// Epic 6 Story 6.1 - E2E Workflow Testing

import { Page } from '@playwright/test';

/**
 * Test user credentials for E2E tests
 *
 * Note: These credentials should exist in your test database.
 * Run database seeders or create these users manually before running tests.
 */
export const TEST_USERS = {
  BLGU: {
    email: 'blgu.test@example.com',
    password: 'TestPassword123!',
    role: 'BLGU_USER',
  },
  ASSESSOR: {
    email: 'assessor.test@example.com',
    password: 'TestPassword123!',
    role: 'ASSESSOR',
  },
} as const;

/**
 * Login helper function for BLGU users
 */
export async function loginAsBLGU(page: Page) {
  await page.goto('/login');

  await page.fill('input[name="email"]', TEST_USERS.BLGU.email);
  await page.fill('input[name="password"]', TEST_USERS.BLGU.password);
  await page.click('button[type="submit"]');

  // Wait for navigation to BLGU dashboard
  await page.waitForURL('**/blgu/**', { timeout: 10000 });
}

/**
 * Login helper function for Assessor users
 */
export async function loginAsAssessor(page: Page) {
  await page.goto('/login');

  await page.fill('input[name="email"]', TEST_USERS.ASSESSOR.email);
  await page.fill('input[name="password"]', TEST_USERS.ASSESSOR.password);
  await page.click('button[type="submit"]');

  // Wait for navigation to Assessor dashboard
  await page.waitForURL('**/assessor/**', { timeout: 10000 });
}

/**
 * Logout helper function
 */
export async function logout(page: Page) {
  // Click user menu or logout button
  // This implementation may need to be updated based on your actual UI
  const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out")');
  if (await logoutButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await logoutButton.click();
  }
}
