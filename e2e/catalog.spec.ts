import { test, expect } from '@playwright/test';

function productCards(page: import('@playwright/test').Page) {
  return page.locator('a[href^="/products/"]');
}

test('صفحة الكتالوج بتفتح وبتعرض عدد الكتب المتاحة', async ({ page }) => {
  await page.goto('/products');
  await expect(page.getByRole('heading', { name: 'كتالوج المنتجات' })).toBeVisible({ timeout: 15000 });
  await expect(page.getByText(/منتج متاح/)).toBeVisible();
});

test('البحث بعنوان كتاب موجود بيرجّع نتيجة، وبحث بكلام عشوائي بيرجّع "مفيش نتائج مطابقة"', async ({
  page,
}) => {
  await page.goto('/products');

  const firstProductLink = productCards(page).first();
  await expect(firstProductLink).toBeVisible();
  const productTitle = await firstProductLink.locator('h3, h2').first().innerText();

  const searchBox = page.getByPlaceholder('ابحث باسم المنتج أو الناشر…');
  await searchBox.fill(productTitle);
  await expect(page.getByText(productTitle)).toBeVisible({ timeout: 5000 });

  await searchBox.fill(`كلام-عشوائي-مالوش-وجود-${Date.now()}`);
  await expect(page.getByText('مفيش نتائج مطابقة')).toBeVisible({ timeout: 5000 });
  await expect(page.getByText('جرّب كلمات بحث تانية أو شيل الفلتر.')).toBeVisible();
});

test('فلترة الكتالوج حسب التصنيف بتعرض كتب من نفس التصنيف بس، والرجوع لـ"كل التصنيفات" بيرجّع الكل', async ({
  page,
}) => {
  await page.goto('/products');
  await expect(productCards(page).first()).toBeVisible();

  const totalBefore = await productCards(page).count();

  await page.getByRole('button', { name: 'روايات' }).click();
  await page.waitForTimeout(500);

  const count = await productCards(page).count();
  if (count === 0) {
    await expect(page.getByText('مفيش نتائج مطابقة')).toBeVisible();
  } else {
    const badges = productCards(page).getByText('روايات', { exact: true });
    await expect(badges).toHaveCount(count);
  }

  await page.getByRole('button', { name: 'كل التصنيفات' }).click();
  await expect(productCards(page)).toHaveCount(totalBefore);
});

test('لو فيه أكتر من صفحة نتائج، التنقل بين الصفحات بيشتغل صح', async ({ page }) => {
  await page.goto('/products');
  await expect(productCards(page).first()).toBeVisible();

  const nextButton = page.getByRole('button', { name: /التالي/ });
  if (!(await nextButton.isVisible())) {
    test.skip(true, 'مفيش صفحات كفاية دلوقتي عشان نختبر الـ pagination (الكتب أقل من صفحة واحدة).');
  }

  const firstProductTitleBefore = await productCards(page).first().locator('h3, h2').first().innerText();

  await nextButton.click();
  await expect(productCards(page).first().locator('h3, h2').first()).not.toHaveText(
    firstProductTitleBefore,
    { timeout: 10000 },
  );
  const firstProductTitleAfter = await productCards(page).first().locator('h3, h2').first().innerText();

  await page.getByRole('button', { name: /السابق/ }).click();
  await expect(productCards(page).first().locator('h3, h2').first()).toHaveText(firstProductTitleBefore);
});