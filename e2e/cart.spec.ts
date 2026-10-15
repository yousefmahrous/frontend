import { test, expect, type Page } from '@playwright/test';

async function addFirstProductToCart(page: Page) {
  await page.goto('/products');
  const firstProductLink = page.locator('a[href^="/products/"]').first();
  await expect(firstProductLink).toBeVisible();

  const productTitle = await firstProductLink.locator('h3, h2').first().innerText();
  await firstProductLink.click();

  await expect(page).toHaveURL(/\/products\/\d+/);
  const productId = page.url().split('/products/')[1];

  await page.getByRole('button', { name: /أضف للعربية/ }).click();
  await expect(page.getByText(/تم إضافة المنتج للعربية/)).toBeVisible({ timeout: 5000 });

  return { productTitle, productId };
}


function cartItemCard(page: Page, productTitle: string) {
  return page.locator('div.rounded-xl.border-border.bg-card').filter({ hasText: productTitle });
}

test('عميل يقدر يفتح كتاب ويضيفه للعربية ويشوفه فيها', async ({ page }) => {
  const { productTitle } = await addFirstProductToCart(page);

  await page.goto('/cart');
  await expect(page.getByText(productTitle)).toBeVisible();

  await cartItemCard(page, productTitle).getByRole('button', { name: 'حذف من العربية' }).click();
  await expect(page.getByText(/تم حذف المنتج من العربية/)).toBeVisible({ timeout: 5000 });
});

test('عميل يقدر يزود وينقص كمية كتاب في العربية', async ({ page }) => {
  const { productTitle } = await addFirstProductToCart(page);

  await page.goto('/cart');
  const item = cartItemCard(page, productTitle);
  await expect(item).toBeVisible();

  const quantityDisplay = item.getByText('1', { exact: true });
  await expect(quantityDisplay).toBeVisible();

  await item.getByRole('button', { name: 'زيادة الكمية' }).click();
  await expect(item.getByText('2', { exact: true })).toBeVisible();

  await item.getByRole('button', { name: 'تقليل الكمية' }).click();
  await expect(item.getByText('1', { exact: true })).toBeVisible();

  await item.getByRole('button', { name: 'حذف من العربية' }).click();
  await expect(page.getByText(/تم حذف المنتج من العربية/)).toBeVisible({ timeout: 5000 });
});

test('عميل يقدر يحذف كتاب من العربية وتفضل العربية فاضية لو كان الكتاب الوحيد', async ({
  page,
}) => {
  const { productTitle } = await addFirstProductToCart(page);

  await page.goto('/cart');
  const item = cartItemCard(page, productTitle);
  await expect(item).toBeVisible();

  await item.getByRole('button', { name: 'حذف من العربية' }).click();
  await expect(page.getByText(/تم حذف المنتج من العربية/)).toBeVisible({ timeout: 5000 });

  await expect(page.getByText('العربية فاضية')).toBeVisible();
  await expect(page.getByText(productTitle)).not.toBeVisible();
});