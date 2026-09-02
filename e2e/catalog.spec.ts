import { test, expect } from '@playwright/test';

function bookCards(page: import('@playwright/test').Page) {
  return page.locator('a[href^="/books/"]');
}

test('صفحة الكتالوج بتفتح وبتعرض عدد الكتب المتاحة', async ({ page }) => {
  await page.goto('/books');
  await expect(page.getByRole('heading', { name: 'كتالوج الكتب' })).toBeVisible({ timeout: 15000 });
  await expect(page.getByText(/كتاب متاح/)).toBeVisible();
});

test('البحث بعنوان كتاب موجود بيرجّع نتيجة، وبحث بكلام عشوائي بيرجّع "مفيش نتائج مطابقة"', async ({
  page,
}) => {
  await page.goto('/books');

  const firstBookLink = bookCards(page).first();
  await expect(firstBookLink).toBeVisible();
  const bookTitle = await firstBookLink.locator('h3, h2').first().innerText();

  const searchBox = page.getByPlaceholder('ابحث بعنوان الكتاب أو دار النشر…');
  await searchBox.fill(bookTitle);
  await expect(page.getByText(bookTitle)).toBeVisible({ timeout: 5000 });

  await searchBox.fill(`كلام-عشوائي-مالوش-وجود-${Date.now()}`);
  await expect(page.getByText('مفيش نتائج مطابقة')).toBeVisible({ timeout: 5000 });
  await expect(page.getByText('جرّب كلمات بحث تانية أو شيل الفلتر.')).toBeVisible();
});

test('فلترة الكتالوج حسب التصنيف بتعرض كتب من نفس التصنيف بس، والرجوع لـ"كل التصنيفات" بيرجّع الكل', async ({
  page,
}) => {
  await page.goto('/books');
  await expect(bookCards(page).first()).toBeVisible();

  const totalBefore = await bookCards(page).count();

  await page.getByRole('button', { name: 'روايات' }).click();
  await page.waitForTimeout(500);

  const count = await bookCards(page).count();
  if (count === 0) {
    await expect(page.getByText('مفيش نتائج مطابقة')).toBeVisible();
  } else {
    const badges = bookCards(page).getByText('روايات', { exact: true });
    await expect(badges).toHaveCount(count);
  }

  await page.getByRole('button', { name: 'كل التصنيفات' }).click();
  await expect(bookCards(page)).toHaveCount(totalBefore);
});

test('لو فيه أكتر من صفحة نتائج، التنقل بين الصفحات بيشتغل صح', async ({ page }) => {
  await page.goto('/books');
  await expect(bookCards(page).first()).toBeVisible();

  const nextButton = page.getByRole('button', { name: /التالي/ });
  if (!(await nextButton.isVisible())) {
    test.skip(true, 'مفيش صفحات كفاية دلوقتي عشان نختبر الـ pagination (الكتب أقل من صفحة واحدة).');
  }

  const firstBookTitleBefore = await bookCards(page).first().locator('h3, h2').first().innerText();

  await nextButton.click();
  await expect(bookCards(page).first().locator('h3, h2').first()).not.toHaveText(
    firstBookTitleBefore,
    { timeout: 10000 },
  );
  const firstBookTitleAfter = await bookCards(page).first().locator('h3, h2').first().innerText();

  await page.getByRole('button', { name: /السابق/ }).click();
  await expect(bookCards(page).first().locator('h3, h2').first()).toHaveText(firstBookTitleBefore);
});