import { test, expect } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test('إرسال فورم تواصل معنا ببيانات صحيحة بيظهر رسالة نجاح وبيفضي الفورم', async ({ page }) => {
  await page.goto('/contact');

  await page.locator('#name').fill('يوسف تيست');
  await page.locator('#email').fill('e2e.contact@example.com');
  await page.locator('#subject').fill('استفسار عن كتاب');
  await page.locator('#message').fill('السلام عليكم، عايز أعرف معاد توفر الكتاب ده تاني في المخزون.');
  await page.getByRole('button', { name: 'إرسال الرسالة' }).click();

  await expect(page.getByText('تم إرسال رسالتك بنجاح، هنرد عليك في أقرب وقت.')).toBeVisible({
    timeout: 5000,
  });
  await expect(page.locator('#name')).toHaveValue('');
  await expect(page.locator('#message')).toHaveValue('');
});

test('فورم تواصل معنا ببيانات فاضية بيظهر رسائل validation لكل الحقول', async ({ page }) => {
  await page.goto('/contact');
  await page.getByRole('button', { name: 'إرسال الرسالة' }).click();

  await expect(page.getByText('الاسم لازم 3 أحرف على الأقل')).toBeVisible();
  await expect(page.getByText('الإيميل غير صحيح')).toBeVisible();
  await expect(page.getByText('الموضوع لازم 3 أحرف على الأقل')).toBeVisible();
  await expect(page.getByText('الرسالة لازم تكون 10 أحرف على الأقل')).toBeVisible();
});

test('فورم تواصل معنا برفض رسالة أقصر من 10 أحرف', async ({ page }) => {
  await page.goto('/contact');

  await page.locator('#name').fill('يوسف تيست');
  await page.locator('#email').fill('e2e.contact@example.com');
  await page.locator('#subject').fill('سؤال');
  await page.locator('#message').fill('قصيرة');
  await page.getByRole('button', { name: 'إرسال الرسالة' }).click();

  await expect(page.getByText('الرسالة لازم تكون 10 أحرف على الأقل')).toBeVisible();
});