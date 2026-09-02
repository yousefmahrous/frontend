import { test, expect } from '@playwright/test';
import { CUSTOMER } from './fixtures/test-users';

test.use({ storageState: { cookies: [], origins: [] } });

function uniqueEmail() {
  return `e2e.signup.${Date.now()}@example.com`;
}

test('يوزر يقدر يفتح صفحة signup من صفحة login', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('link', { name: 'إنشاء حساب جديد' }).click();
  await expect(page).toHaveURL('/signup');
  await expect(page.getByRole('heading', { name: 'إنشاء حساب' })).toBeVisible();
});

test('التسجيل ببيانات فاضية بيظهر رسائل validation', async ({ page }) => {
  await page.goto('/signup');
  await page.getByRole('button', { name: 'إنشاء الحساب' }).click();

  await expect(page.getByText('الاسم لازم 3 أحرف على الأقل')).toBeVisible();
  await expect(page.getByText('الإيميل غير صحيح')).toBeVisible();
  await expect(page.getByText('كلمة المرور لازم 6 أحرف على الأقل')).toBeVisible();
});

test('التسجيل بإيميل صيغته غلط وكلمة مرور قصيرة بيظهر الأخطاء المناسبة', async ({ page }) => {
  await page.goto('/signup');

  await page.locator('#name').fill('يوسف تيست');
  await page.locator('#email').fill('not-an-email');
  await page.locator('#password').fill('123');
  await page.getByRole('button', { name: 'إنشاء الحساب' }).click();

  await expect(page.getByText('الإيميل غير صحيح')).toBeVisible();
  await expect(page.getByText('كلمة المرور لازم 6 أحرف على الأقل')).toBeVisible();
  await expect(page.getByText('الاسم لازم 3 أحرف على الأقل')).not.toBeVisible();
});

test('يوزر جديد يقدر يعمل signup بنجاح ويتحول لصفحة login', async ({ page }) => {
  const email = uniqueEmail();

  await page.goto('/signup');
  await page.locator('#name').fill('يوسف تيست');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill('123456');
  await page.getByRole('button', { name: 'إنشاء الحساب' }).click();

  await expect(
    page.getByText('تم إنشاء الحساب بنجاح، برجاء مراجعة بريدك الإلكتروني لتأكيد حسابك'),
  ).toBeVisible({ timeout: 5000 });
  await expect(page).toHaveURL('/login');
});

test('محاولة signup بإيميل مسجل قبل كده بتظهر رسالة خطأ ومفيش تحويل', async ({ page }) => {
  await page.goto('/signup');
  await page.locator('#name').fill('يوسف تيست');
  await page.locator('#email').fill(CUSTOMER.email);
  await page.locator('#password').fill('123456');
  await page.getByRole('button', { name: 'إنشاء الحساب' }).click();

  await expect(page.getByText('الإيميل ده مستخدم قبل كده')).toBeVisible({ timeout: 5000 });
  await expect(page).toHaveURL('/signup');
});

test('يوزر عمل signup ولسه ما أكدش إيميله بيتمنع من تسجيل الدخول ويقدر يطلب رابط تأكيد جديد', async ({
  page,
}) => {
  const email = uniqueEmail();

  await page.goto('/signup');
  await page.locator('#name').fill('يوسف تيست');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill('123456');
  await page.getByRole('button', { name: 'إنشاء الحساب' }).click();
  await expect(page).toHaveURL('/login');

  await page.locator('#email').fill(email);
  await page.locator('#password').fill('123456');
  await page.getByRole('button', { name: 'دخول' }).click();

  await expect(page.getByText('لازم تأكد بريدك الإلكتروني الأول قبل تسجيل الدخول.')).toBeVisible({
    timeout: 5000,
  });

  const resendButton = page.getByRole('button', { name: 'إعادة إرسال رابط التأكيد' });
  await expect(resendButton).toBeVisible();
  await resendButton.click();
  await expect(
    page.getByText('لو الإيميل ده مسجل عندنا وغير مفعّل، هيوصلك رابط تأكيد جديد خلال دقايق'),
  ).toBeVisible({ timeout: 5000 });
});