import { test, expect } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test('يوزر مش عامل login بيشوف رسالة "محتاج تسجيل دخول" في /account', async ({ page }) => {
  await page.goto('/account');
  await expect(page.getByRole('heading', { name: 'محتاج تسجيل دخول' })).toBeVisible();
  await expect(page).toHaveURL('/account'); 
});

test('يوزر مش عامل login بيشوف رسالة "محتاج تسجيل دخول" في /admin/books', async ({ page }) => {
  await page.goto('/admin/books');
  await expect(page.getByRole('heading', { name: 'محتاج تسجيل دخول' })).toBeVisible();
});