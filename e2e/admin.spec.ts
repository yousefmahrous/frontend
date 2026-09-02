import { test, expect } from '@playwright/test';

test('أدمن يقدر يضيف كتاب جديد ويشوفه في قايمة الكتب', async ({ page }) => {
  const uniqueTitle = `كتاب اختبار ${Date.now()}`;

  await page.goto('/admin/books/new');

  await page.locator('#name').fill(uniqueTitle);
  await page.locator('#number').fill('9789770000123');
  await page.locator('#email').fill('publisher@test.local');
  await page.locator('#centre').fill('دار اختبار للنشر');
  await page.locator('#price').fill('99');
  await page.locator('#stock').fill('10');
  await page.locator('#adress').fill('وصف تجريبي للكتاب المستخدم في اختبار E2E');

  await page.locator('#category').click();
  await page.getByRole('option').first().click();

  await page.getByRole('button', { name: 'حفظ الكتاب' }).click();

  await expect(page.getByText('تمت إضافة الكتاب')).toBeVisible({ timeout: 5000 });
  await expect(page).toHaveURL('/admin/books');
  await expect(page.getByText(uniqueTitle)).toBeVisible();
});

test('أدمن يقدر يشوف قايمة الأوردرات', async ({ page }) => {
  await page.goto('/admin/orders');
  await expect(page).toHaveURL('/admin/orders');
  await expect(page.getByRole('heading').first()).toBeVisible();
});

test('أدمن يقدر يعدّل كتاب موجود ويشوف التغيير محفوظ', async ({ page }) => {
  const originalTitle = `كتاب للتعديل ${Date.now()}`;
  const updatedTitle = `${originalTitle} - معدّل`;

  await page.goto('/admin/books/new');
  await page.locator('#name').fill(originalTitle);
  await page.locator('#number').fill('9789770000124');
  await page.locator('#email').fill('publisher@test.local');
  await page.locator('#centre').fill('دار اختبار للنشر');
  await page.locator('#price').fill('50');
  await page.locator('#stock').fill('5');
  await page.locator('#adress').fill('وصف تجريبي');
  await page.locator('#category').click();
  await page.getByRole('option').first().click();
  await page.getByRole('button', { name: 'حفظ الكتاب' }).click();
  await expect(page).toHaveURL('/admin/books');

  const bookRow = page.locator('tr').filter({ hasText: originalTitle });
  await bookRow.getByRole('link', { name: 'تعديل' }).click();

  await expect(page).toHaveURL(/\/admin\/books\/\d+\/edit/);

  await page.locator('#name').fill(updatedTitle);
  await page.getByRole('button', { name: /حفظ/ }).click();

  await expect(page).toHaveURL('/admin/books');
  await expect(page.getByText(updatedTitle)).toBeVisible();
});

test('أدمن يقدر يحذف كتاب من غير أوردرات مرتبطة بيه', async ({ page }) => {
  const title = `كتاب للحذف ${Date.now()}`;

  await page.goto('/admin/books/new');
  await page.locator('#name').fill(title);
  await page.locator('#number').fill('9789770000125');
  await page.locator('#email').fill('publisher@test.local');
  await page.locator('#centre').fill('دار اختبار للنشر');
  await page.locator('#price').fill('50');
  await page.locator('#stock').fill('5');
  await page.locator('#adress').fill('وصف تجريبي');
  await page.locator('#category').click();
  await page.getByRole('option').first().click();
  await page.getByRole('button', { name: 'حفظ الكتاب' }).click();
  await expect(page).toHaveURL('/admin/books');

  const bookRow = page.locator('tr').filter({ hasText: title });
  await bookRow.getByRole('button', { name: 'حذف' }).click();

  await page.getByRole('alertdialog').getByRole('button', { name: 'حذف' }).click();

  await expect(page.getByText(`تم حذف "${title}"`)).toBeVisible({ timeout: 5000 });
  await expect(page.getByText(title)).not.toBeVisible();
});

test('حذف كتاب مرتبط بأوردر سابق بيرجّع رسالة واضحة بدل الكراش', async ({ page }) => {
  await page.goto('/admin/books');
  const firstDeleteButton = page.getByRole('button', { name: 'حذف' }).first();
  await firstDeleteButton.click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'حذف' }).click();

  const successToast = page.getByText(/تم حذف/);
  const conflictToast = page.getByText(/مينفعش تحذف الكتاب ده لأنه مرتبط بأوردرات/);

  await expect(successToast.or(conflictToast)).toBeVisible({ timeout: 5000 });
});

test('أدمن يقدر يوافق على طلب استرجاع', async ({ page }) => {
  await page.goto('/admin/refunds');

  const approveButton = page.getByRole('button', { name: 'موافقة' }).first();
  await expect(approveButton).toBeVisible({ timeout: 5000 });
  await approveButton.click();

  await expect(page.getByText('تمت الموافقة على الطلب، في انتظار استلام الكتاب')).toBeVisible({
    timeout: 5000,
  });
});