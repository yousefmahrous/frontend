import { test, expect, type Page, type Locator } from '@playwright/test';

async function openFirstProduct(page: Page) {
  await page.goto('/products');
  const firstProductLink = page.locator('a[href^="/products/"]').first();
  await expect(firstProductLink).toBeVisible();

  const productTitle = await firstProductLink.locator('h3, h2').first().innerText();
  await firstProductLink.click();

  await expect(page).toHaveURL(/\/products\/\d+/);
  await expect(page.getByRole('heading', { level: 1, name: productTitle })).toBeVisible();

  return { productTitle };
}

async function toggleFavoriteAndExpect(page: Page, button: Locator, expectedLabel: string) {
  await button.click();

  const errorToast = page.getByText(/فشل|خطأ|غير مسجل|حدث/).first();
  const result = await Promise.race([
    expect(page.getByTestId('product-detail-favorite-toggle'))
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
  const { productTitle } = await openFirstProduct(page);

  const favoriteButton = page.getByTestId('product-detail-favorite-toggle');
  await toggleFavoriteAndExpect(page, favoriteButton, 'احذف من المفضلة');

  await page.goto('/favorites');
  await expect(page.getByText(productTitle)).toBeVisible();

  await page
    .locator('div.rounded-xl.border-border.bg-card')
    .filter({ hasText: productTitle })
    .getByRole('button', { name: 'حذف من المفضلة' })
    .click();
  await expect(page.getByText('المفضلة فاضية')).toBeVisible();
});

test('عميل يقدر يحذف كتاب من المفضلة عن طريق زرار toggle في صفحة الكتاب نفسها', async ({
  page,
}) => {
  const { productTitle } = await openFirstProduct(page);
  const favoriteButton = page.getByTestId('product-detail-favorite-toggle');

  await toggleFavoriteAndExpect(page, favoriteButton, 'احذف من المفضلة');

  await toggleFavoriteAndExpect(page, favoriteButton, 'ضيف للمفضلة');

  await page.goto('/favorites');
  await expect(page.getByText(productTitle)).not.toBeVisible();
});

test('عميل يقدر يضيف كتاب للعربية من صفحة المفضلة', async ({ page }) => {
  const { productTitle } = await openFirstProduct(page);
  const favoriteButton = page.getByTestId('product-detail-favorite-toggle');

  await toggleFavoriteAndExpect(page, favoriteButton, 'احذف من المفضلة');

  await page.goto('/favorites');
  const favoriteCard = page
    .locator('div.rounded-xl.border-border.bg-card')
    .filter({ hasText: productTitle });
  await expect(favoriteCard).toBeVisible();

  await favoriteCard.getByRole('button', { name: 'أضف للعربية' }).click();
  await expect(page.getByText(/تم إضافة المنتج للعربية/)).toBeVisible({ timeout: 5000 });

  await page.goto('/cart');
  await page
    .locator('div.rounded-xl.border-border.bg-card')
    .filter({ hasText: productTitle })
    .getByRole('button', { name: 'حذف من العربية' })
    .click();
  await expect(page.getByText(/تم حذف المنتج من العربية/)).toBeVisible({ timeout: 5000 });

 
  await page.goto('/favorites');

  await favoriteCard.getByRole('button', { name: 'حذف من المفضلة' }).click();
  await expect(page.getByText('المفضلة فاضية')).toBeVisible();
});

test('المفضلة بتفضل فاضية وبتظهر رسالة مناسبة لما ملهاش عناصر', async ({ page }) => {
  await page.goto('/favorites');
  await expect(page.getByText('المفضلة فاضية')).toBeVisible();
  await expect(
    page.getByText('لسه ما ضفتش أي منتج للمفضلة. روح تصفح الكتالوج وضيف اللي يعجبك.'),
  ).toBeVisible();
});