import { test, expect } from '@playwright/test';
import { CUSTOMER } from './fixtures/test-users';

test('صفحة حسابي بتعرض الاسم والإيميل ونوع الحساب صح', async ({ page }) => {
  await page.goto('/account');
  await expect(page.getByRole('heading', { name: 'حسابي' })).toBeVisible();
  await expect(page.getByText('الإيميل')).toBeVisible();
  await expect(page.getByText(CUSTOMER.email)).toBeVisible();
  await expect(page.getByText('نوع الحساب')).toBeVisible();
  await expect(page.getByText('عميل', { exact: true })).toBeVisible();
});

test.describe('logout', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('عميل يقدر يعمل logout من القائمة وبعدها يتمنع من دخول /account', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#email').fill(CUSTOMER.email);
    await page.locator('#password').fill(CUSTOMER.password);
    await page.getByRole('button', { name: 'دخول' }).click();
    await expect(page).toHaveURL('/books');

    await page.goto('/account');
    const customerName = await page.locator('p:text-is("الاسم") + p').innerText();

    await page.goto('/');
    await page.getByRole('button', { name: customerName }).click();
    await page.getByText('تسجيل خروج').click();

    await expect(page.getByText('تم تسجيل الخروج بنجاح')).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL('/login');

    await page.goto('/account');
    await expect(page.getByRole('heading', { name: 'محتاج تسجيل دخول' })).toBeVisible();
  });
});