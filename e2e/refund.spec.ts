import { test, expect } from '@playwright/test';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test('عميل يقدر يطلب استرجاع لأوردر مدفوع', async ({ page }) => {

  const backendPath = path.resolve(__dirname, '../../backend');
  execSync('node scripts/seed-paid-order.js', { cwd: backendPath, stdio: 'inherit' });

  await page.goto('/orders');

  const requestRefundButton = page.getByRole('button', { name: 'طلب استرجاع' }).first();
  await expect(requestRefundButton).toBeVisible({ timeout: 5000 });
  await requestRefundButton.click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  await dialog.locator('textarea').fill('الكتاب وصل تالف، عايز أسترجع فلوسي');
  await dialog.getByRole('button', { name: 'إرسال الطلب' }).click();

  await expect(page.getByText('تم إرسال طلب الاسترجاع بنجاح')).toBeVisible({ timeout: 5000 });
  await expect(page.getByText('طلب الاسترجاع قيد المراجعة').first()).toBeVisible();
});