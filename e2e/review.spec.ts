import { test, expect, type Page } from '@playwright/test';

async function openFirstBook(page: Page) {
  await page.goto('/books');
  const firstBookLink = page.locator('a[href^="/books/"]').first();
  await expect(firstBookLink).toBeVisible();

  const bookTitle = await firstBookLink.locator('h3, h2').first().innerText();
  await firstBookLink.click();

  await expect(page).toHaveURL(/\/books\/\d+/);
  await expect(page.getByRole('heading', { level: 1, name: bookTitle })).toBeVisible();

  return { bookTitle };
}

function reviewCard(page: Page) {
  return page.locator('form.rounded-xl.border-border.bg-card');
}

test('عميل يشوف قسم التقييمات في صفحة تفاصيل الكتاب', async ({ page }) => {
  await openFirstBook(page);
  await expect(page.getByRole('heading', { name: 'التقييمات والمراجعات' })).toBeVisible();
});

test('عميل مايقدرش يبعت تقييم بدون اختيار نجوم أو بتعليق قصير', async ({ page }) => {
  await openFirstBook(page);

  const form = reviewCard(page);
  await form.getByRole('button', { name: /إرسال التقييم|حفظ التعديل/ }).click();
  await expect(page.getByText('اختار تقييم من 1 لـ5 نجوم')).toBeVisible();

  await form.getByRole('button', { name: '4 نجوم' }).click();
  await form.locator('textarea').fill('حل');
  await form.getByRole('button', { name: /إرسال التقييم|حفظ التعديل/ }).click();
  await expect(page.getByText('التعليق لازم يكون 3 حروف على الأقل')).toBeVisible();
});

test('عميل يقدر يضيف تقييم للكتاب ويعدّله ويحذفه', async ({ page }) => {
  const { bookTitle: _bookTitle } = await openFirstBook(page);
  const comment = `تجربة رائعة للكتاب - ${Date.now()}`;

  const form = reviewCard(page);
  await form.getByRole('button', { name: '5 نجوم' }).click();
  await form.locator('textarea').fill(comment);
  await form.getByRole('button', { name: /إرسال التقييم|حفظ التعديل/ }).click();

  await expect(page.getByText(/تم (إضافة|تعديل) تقييمك بنجاح/)).toBeVisible({ timeout: 5000 });
  await expect(page.getByText(comment)).toBeVisible();

  const updatedComment = `${comment} - تعديل`;
  await form.locator('textarea').fill(updatedComment);
  await form.getByRole('button', { name: 'حفظ التعديل' }).click();
  await expect(page.getByText('تم تعديل تقييمك بنجاح')).toBeVisible({ timeout: 5000 });
  await expect(page.getByText(updatedComment)).toBeVisible();

  const myReviewCard = page
    .locator('div.rounded-xl.border-border.bg-card')
    .filter({ hasText: updatedComment });
  await myReviewCard.getByRole('button', { name: 'احذف التقييم' }).click();
  await expect(page.getByText('تم حذف التقييم بنجاح')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('p').filter({ hasText: updatedComment })).not.toBeVisible();
});