import { test, expect, type Page, type Locator } from '@playwright/test';

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

async function toggleFavoriteAndExpect(page: Page, button: Locator, expectedLabel: string) {
  await button.click();

  const errorToast = page.getByText(/فشل|خطأ|غير مسجل|حدث/).first();
  const result = await Promise.race([
    expect(page.getByTestId('book-detail-favorite-toggle'))
      .toHaveAttribute('aria-label', expectedLabel, { timeout: 5000 })
      .then(() => 'ok' as const)
      .catch(() => 'timeout' as const),
    errorToast
      .waitFor({ state: 'visible', timeout: 5000 })
      .then(() => 'error' as const)
      .catch(() => 'timeout' as const),
  ]);

  if (result === 'error') {
    throw new Error(`توقعنا تقليب حالة المفضلة، بس ظهر توست خطأ: "${await errorToast.textContent()}"`);
  }
  if (result === 'timeout') {
    throw new Error('زرار المفضلة ما اتقلبش ومفيش أي توست خطأ ظهر - محتاج فحص يدوي.');
  }
}

test('عميل يقدر يضيف كتاب للمفضلة من صفحة تفاصيل الكتاب ويشوفه في /favorites', async ({
  page,
}) => {
  const { bookTitle } = await openFirstBook(page);

  const favoriteButton = page.getByTestId('book-detail-favorite-toggle');
  await toggleFavoriteAndExpect(page, favoriteButton, 'احذف من المفضلة');

  await page.goto('/favorites');
  await expect(page.getByText(bookTitle)).toBeVisible();

  await page
    .locator('div.rounded-xl.border-border.bg-card')
    .filter({ hasText: bookTitle })
    .getByRole('button', { name: 'حذف من المفضلة' })
    .click();
  await expect(page.getByText('المفضلة فاضية')).toBeVisible();
});

test('عميل يقدر يحذف كتاب من المفضلة عن طريق زرار toggle في صفحة الكتاب نفسها', async ({
  page,
}) => {
  const { bookTitle } = await openFirstBook(page);
  const favoriteButton = page.getByTestId('book-detail-favorite-toggle');

  await toggleFavoriteAndExpect(page, favoriteButton, 'احذف من المفضلة');

  await toggleFavoriteAndExpect(page, favoriteButton, 'ضيف للمفضلة');

  await page.goto('/favorites');
  await expect(page.getByText(bookTitle)).not.toBeVisible();
});

test('عميل يقدر يضيف كتاب للعربية من صفحة المفضلة', async ({ page }) => {
  const { bookTitle } = await openFirstBook(page);
  const favoriteButton = page.getByTestId('book-detail-favorite-toggle');

  await toggleFavoriteAndExpect(page, favoriteButton, 'احذف من المفضلة');

  await page.goto('/favorites');
  const favoriteCard = page
    .locator('div.rounded-xl.border-border.bg-card')
    .filter({ hasText: bookTitle });
  await expect(favoriteCard).toBeVisible();

  await favoriteCard.getByRole('button', { name: 'أضف للعربية' }).click();
  await expect(page.getByText(/تم إضافة الكتاب للعربية/)).toBeVisible({ timeout: 5000 });

  await page.goto('/cart');
  await page
    .locator('div.rounded-xl.border-border.bg-card')
    .filter({ hasText: bookTitle })
    .getByRole('button', { name: 'حذف من العربية' })
    .click();
  await expect(page.getByText(/تم حذف الكتاب من العربية/)).toBeVisible({ timeout: 5000 });

 
  await page.goto('/favorites');

  await favoriteCard.getByRole('button', { name: 'حذف من المفضلة' }).click();
  await expect(page.getByText('المفضلة فاضية')).toBeVisible();
});

test('المفضلة بتفضل فاضية وبتظهر رسالة مناسبة لما ملهاش عناصر', async ({ page }) => {
  await page.goto('/favorites');
  await expect(page.getByText('المفضلة فاضية')).toBeVisible();
  await expect(
    page.getByText('لسه ما ضفتش أي كتاب للمفضلة. روح تصفح الكتالوج وضيف اللي يعجبك.'),
  ).toBeVisible();
});