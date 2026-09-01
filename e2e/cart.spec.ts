import { test, expect, type Page } from '@playwright/test';

async function addFirstBookToCart(page: Page) {
  await page.goto('/books');
  const firstBookLink = page.locator('a[href^="/books/"]').first();
  await expect(firstBookLink).toBeVisible();

  const bookTitle = await firstBookLink.locator('h3, h2').first().innerText();
  await firstBookLink.click();

  await expect(page).toHaveURL(/\/books\/\d+/);
  const bookId = page.url().split('/books/')[1];

  await page.getByRole('button', { name: /أضف للعربية/ }).click();
  await expect(page.getByText(/تم إضافة الكتاب للعربية/)).toBeVisible({ timeout: 5000 });

  return { bookTitle, bookId };
}


function cartItemCard(page: Page, bookTitle: string) {
  return page.locator('div.rounded-xl.border-border.bg-card').filter({ hasText: bookTitle });
}

test('عميل يقدر يفتح كتاب ويضيفه للعربية ويشوفه فيها', async ({ page }) => {
  const { bookTitle } = await addFirstBookToCart(page);

  await page.goto('/cart');
  await expect(page.getByText(bookTitle)).toBeVisible();

  await cartItemCard(page, bookTitle).getByRole('button', { name: 'حذف من العربية' }).click();
  await expect(page.getByText(/تم حذف الكتاب من العربية/)).toBeVisible({ timeout: 5000 });
});

test('عميل يقدر يزود وينقص كمية كتاب في العربية', async ({ page }) => {
  const { bookTitle } = await addFirstBookToCart(page);

  await page.goto('/cart');
  const item = cartItemCard(page, bookTitle);
  await expect(item).toBeVisible();

  const quantityDisplay = item.getByText('1', { exact: true });
  await expect(quantityDisplay).toBeVisible();

  await item.getByRole('button', { name: 'زيادة الكمية' }).click();
  await expect(item.getByText('2', { exact: true })).toBeVisible();

  await item.getByRole('button', { name: 'تقليل الكمية' }).click();
  await expect(item.getByText('1', { exact: true })).toBeVisible();

  await item.getByRole('button', { name: 'حذف من العربية' }).click();
  await expect(page.getByText(/تم حذف الكتاب من العربية/)).toBeVisible({ timeout: 5000 });
});

test('عميل يقدر يحذف كتاب من العربية وتفضل العربية فاضية لو كان الكتاب الوحيد', async ({
  page,
}) => {
  const { bookTitle } = await addFirstBookToCart(page);

  await page.goto('/cart');
  const item = cartItemCard(page, bookTitle);
  await expect(item).toBeVisible();

  await item.getByRole('button', { name: 'حذف من العربية' }).click();
  await expect(page.getByText(/تم حذف الكتاب من العربية/)).toBeVisible({ timeout: 5000 });

  await expect(page.getByText('العربية فاضية')).toBeVisible();
  await expect(page.getByText(bookTitle)).not.toBeVisible();
});