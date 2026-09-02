import { test, expect, type Page } from '@playwright/test';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_URL = 'http://localhost:3000/api/v1';

type OrderStatus = 'pending' | 'paid' | 'failed' | 'cancelled';
type Order = { id: number; status: OrderStatus };

async function emptyCart(page: Page) {
  await page.goto('/cart');

  const removeButton = page.getByRole('button', { name: 'حذف من العربية' }).first();

  while (await removeButton.isVisible().catch(() => false)) {
    await removeButton.click();
    await page.waitForTimeout(500);
  }
}

async function addFirstBookToCart(page: Page) {
  await page.goto('/books');
  const firstBookLink = page.locator('a[href^="/books/"]').first();
  await expect(firstBookLink).toBeVisible();
  await firstBookLink.click();

  await page.getByRole('button', { name: /أضف للعربية/ }).click();
  await expect(page.getByText(/تم إضافة الكتاب للعربية/)).toBeVisible({ timeout: 5000 });
}

async function startCheckout(page: Page) {
  await page.goto('/cart');
  await page.getByRole('button', { name: 'المتابعة للدفع' }).click();
  await expect(page).toHaveURL(/checkout\.stripe\.com/, { timeout: 15000 });

  await page.goto('/');
}

async function getLatestOrder(page: Page): Promise<Order> {
  return page.evaluate(async (apiUrl) => {
    const res = await fetch(`${apiUrl}/orders/latest`, { credentials: 'include' });
    const body = await res.json();
    return body.data;
  }, API_URL);
}

async function getOrder(page: Page, orderId: number): Promise<Order> {
  return page.evaluate(
    async ({ apiUrl, id }) => {
      const res = await fetch(`${apiUrl}/orders/${id}`, { credentials: 'include' });
      const body = await res.json();
      return body.data;
    },
    { apiUrl: API_URL, id: orderId }
  );
}

function simulateWebhook(orderId: number, eventType: 'completed' | 'expired') {
  const backendPath = path.resolve(__dirname, '../../backend');
  execSync(`node scripts/simulate-stripe-webhook.js ${orderId} ${eventType}`, {
    cwd: backendPath,
    stdio: 'inherit',
  });
}

test.beforeAll(() => {

  const backendPath = path.resolve(__dirname, '../../backend');
  execSync('node scripts/restock-latest-book.js', { cwd: backendPath, stdio: 'inherit' });
});

test('عميل يقدر يعمل checkout ويتحول لصفحة Stripe فعليًا', async ({ page }) => {
  await page.goto('/books');
  const firstBookLink = page.locator('a[href^="/books/"]').first();
  await expect(firstBookLink).toBeVisible();
  await firstBookLink.click();

  await page.getByRole('button', { name: /أضف للعربية/ }).click();
  await expect(page.getByText(/تم إضافة الكتاب للعربية/)).toBeVisible({ timeout: 5000 });

  await page.goto('/cart');
  await page.getByRole('button', { name: 'المتابعة للدفع' }).click();

  await expect(page).toHaveURL(/checkout\.stripe\.com/, { timeout: 15000 });
});

test('checkout بيرفض لو العربية فاضية', async ({ page }) => {
  await emptyCart(page);

  await page.goto('/cart');
  const checkoutButton = page.getByRole('button', { name: 'المتابعة للدفع' });
  await expect(checkoutButton).not.toBeVisible();
});

test('لما webhook الدفع يتأكد، صفحة النجاح تتحدث لوحدها من "قيد التأكيد" لـ "تم الدفع"', async ({
  page,
}) => {
  await emptyCart(page);
  await addFirstBookToCart(page);
  await startCheckout(page);

  const order = await getLatestOrder(page);
  expect(order?.status).toBe('pending');

  await page.goto(`/checkout/success?order_id=${order.id}`);
  await expect(page.getByText('بنتأكد من الدفع')).toBeVisible();

  simulateWebhook(order.id, 'completed');


  await expect(page.getByText('تم الدفع بنجاح')).toBeVisible({ timeout: 10000 });
});

test('لو جلسة الدفع انتهت، الأوردر يفشل والمخزون يترجع للكتاب تلقائيًا', async ({ page }) => {
  await emptyCart(page);
  await addFirstBookToCart(page);
  await startCheckout(page);

  const order = await getLatestOrder(page);
  expect(order?.status).toBe('pending');

  simulateWebhook(order.id, 'expired');

  const updatedOrder = await getOrder(page, order.id);
  expect(updatedOrder?.status).toBe('failed');

  await page.goto('/cart');
  await expect(page.getByRole('button', { name: 'حذف من العربية' })).toHaveCount(0);

  await addFirstBookToCart(page);
});

test('لو فيه أوردر pending قديم وعمل checkout تاني، القديم يتلغي تلقائيًا', async ({ page }) => {
  await emptyCart(page);
  await addFirstBookToCart(page);
  await startCheckout(page);

  const firstOrder = await getLatestOrder(page);
  expect(firstOrder?.status).toBe('pending');

  await startCheckout(page);

  const secondOrder = await getLatestOrder(page);
  expect(secondOrder.id).not.toBe(firstOrder.id);
  expect(secondOrder.status).toBe('pending');

  const staleOrder = await getOrder(page, firstOrder.id);
  expect(staleOrder?.status).toBe('cancelled');
});

test('صفحة الإلغاء بتظهر صح لما اليوزر يرجع من Stripe من غير ما يكمل الدفع', async ({ page }) => {
  await emptyCart(page);
  await addFirstBookToCart(page);
  await startCheckout(page);

  const order = await getLatestOrder(page);

  await page.goto(`/checkout/cancel?order_id=${order.id}`);

  await expect(page.getByText('اتلغى الدفع')).toBeVisible();
  await expect(page.getByRole('link', { name: 'الرجوع للعربية' })).toBeVisible();
});