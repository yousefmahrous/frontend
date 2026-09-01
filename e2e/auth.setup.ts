import { test as setup, expect } from '@playwright/test';
import { CUSTOMER, ADMIN } from './fixtures/test-users';

const customerAuthFile = 'e2e/.auth/customer.json';
const adminAuthFile = 'e2e/.auth/admin.json';

setup('تسجيل دخول كعميل وحفظ الجلسة', async ({ page }) => {
  await page.goto('/login');
  await page.locator('#email').fill(CUSTOMER.email);
  await page.locator('#password').fill(CUSTOMER.password);
  await page.getByRole('button', { name: 'دخول' }).click();

  await expect(page).toHaveURL('/books');

  await page.context().storageState({ path: customerAuthFile });
});

setup('تسجيل دخول كأدمن وحفظ الجلسة', async ({ page }) => {
  await page.goto('/login');
  await page.locator('#email').fill(ADMIN.email);
  await page.locator('#password').fill(ADMIN.password);
  await page.getByRole('button', { name: 'دخول' }).click();

  await expect(page).toHaveURL('/books');

  await page.context().storageState({ path: adminAuthFile });
});