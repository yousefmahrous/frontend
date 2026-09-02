import { test, expect } from '@playwright/test';
import { CUSTOMER } from './fixtures/test-users';

test.describe('استعادة كلمة المرور (بدون تسجيل دخول)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('طلب forgot-password بإيميل مسجل بيظهر رسالة عامة ونفس الرسالة تظهر تحت الفورم', async ({
    page,
  }) => {
    await page.goto('/forgot-password');
    await page.locator('#email').fill(CUSTOMER.email);
    await page.getByRole('button', { name: 'إرسال الرابط' }).click();

    await expect(
      page.getByText('إذا كان البريد مسجلاً لدينا، ستصلك رسالة تحتوي على رابط التعيين.'),
    ).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('راجع بريدك الإلكتروني، الرابط بيوصل خلال دقايق.')).toBeVisible();
  });

  test('طلب forgot-password بإيميل مش مسجل بيظهر نفس الرسالة العامة (مفيش تسريب معلومات)', async ({
    page,
  }) => {
    await page.goto('/forgot-password');
    await page.locator('#email').fill(`no-such-user.${Date.now()}@example.com`);
    await page.getByRole('button', { name: 'إرسال الرابط' }).click();

    await expect(
      page.getByText('إذا كان البريد مسجلاً لدينا، ستصلك رسالة تحتوي على رابط التعيين.'),
    ).toBeVisible({ timeout: 5000 });
  });

  test('forgot-password برفض إيميل بصيغة غلط قبل ما يبعت للسيرفر', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.locator('#email').fill('not-an-email');
    await page.getByRole('button', { name: 'إرسال الرابط' }).click();

    await expect(page.getByText('الإيميل غير صحيح')).toBeVisible();
  });

  test('فتح /reset-password من غير توكن بيظهر رسالة رابط غير صالح', async ({ page }) => {
    await page.goto('/reset-password');
    await expect(page.getByRole('heading', { name: 'رابط غير صالح' })).toBeVisible();
    await page.getByRole('link', { name: 'طلب رابط جديد' }).click();
    await expect(page).toHaveURL('/forgot-password');
  });

  test('reset-password بتوكن غلط أو منتهي بيرجّع رسالة خطأ واضحة', async ({ page }) => {
    await page.goto('/reset-password?token=this-token-does-not-exist');
    await expect(page.getByRole('heading', { name: 'كلمة مرور جديدة' })).toBeVisible();

    await page.locator('#newPassword').fill('newpass123');
    await page.getByRole('button', { name: 'تعيين كلمة المرور' }).click();

    await expect(page.getByText('الرابط غير صالح أو انتهت صلاحيته.')).toBeVisible({
      timeout: 5000,
    });
    await expect(page).toHaveURL(/\/reset-password/);
  });

  test('reset-password برفض كلمة مرور أقل من 6 أحرف', async ({ page }) => {
    await page.goto('/reset-password?token=this-token-does-not-exist');
    await page.locator('#newPassword').fill('123');
    await page.getByRole('button', { name: 'تعيين كلمة المرور' }).click();

    await expect(page.getByText('كلمة المرور لازم 6 أحرف على الأقل')).toBeVisible();
  });
});

test.describe('تغيير كلمة المرور (عميل مسجل دخول)', () => {
  test('تغيير كلمة المرور بالباسورد القديم غلط بيرجّع رسالة خطأ ومفيش logout', async ({ page }) => {
    await page.goto('/account/change-password');
    await expect(page.getByRole('heading', { name: 'تغيير كلمة المرور' })).toBeVisible({
      timeout: 15000,
    });

    await page.locator('#oldPassword').fill('wrong-old-password');
    await page.locator('#newPassword').fill('some-new-pass-123');
    await page.getByRole('button', { name: 'تغيير كلمة المرور' }).click();

    await expect(page.getByText('كلمة المرور القديمة غير صحيحة')).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL('/account/change-password');
  });

  test('تغيير كلمة المرور برفض باسورد جديد أقل من 6 أحرف', async ({ page }) => {
    await page.goto('/account/change-password');
    await expect(page.getByRole('heading', { name: 'تغيير كلمة المرور' })).toBeVisible({
      timeout: 15000,
    });

    await page.locator('#oldPassword').fill(CUSTOMER.password);
    await page.locator('#newPassword').fill('123');
    await page.getByRole('button', { name: 'تغيير كلمة المرور' }).click();

    await expect(page.getByText('كلمة المرور الجديدة لازم 6 أحرف على الأقل')).toBeVisible();
  });
});