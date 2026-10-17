import { test, expect, type Page } from "@playwright/test";
import { ADMIN, CUSTOMER, PENDING_VENDOR, VENDOR } from "./fixtures/test-users";

test.use({ storageState: { cookies: [], origins: [] } });

async function login(page: Page, user: { email: string; password: string }) {
  await page.goto("/login");
  await page.locator("#email").fill(user.email);
  await page.locator("#password").fill(user.password);
  await page.getByRole("button", { name: "دخول" }).click();
}

test("أدمن بعد اللوجين يروح مباشرة على لوحة تحكم الأدمن", async ({ page }) => {
  await login(page, ADMIN);
  await expect(page).toHaveURL("/admin/dashboard");
  await expect(page.getByRole("heading", { name: "لوحة تحكم الأدمن" })).toBeVisible();
});

test("بائع مقبول بعد اللوجين يروح مباشرة على لوحة تحكم التاجر", async ({ page }) => {
  await login(page, VENDOR);
  await expect(page).toHaveURL("/vendor/dashboard");
  await expect(page.getByRole("heading", { name: "لوحة تحكم التاجر" })).toBeVisible();
});

test("عميل عادي بعد اللوجين يروح على المتجر", async ({ page }) => {
  await login(page, CUSTOMER);
  await expect(page).toHaveURL("/products");
});

test("بائع لسه تحت المراجعة بعد اللوجين يروح على المتجر مش الداشبورد", async ({ page }) => {
  await login(page, PENDING_VENDOR);
  await expect(page).toHaveURL("/products");
});

test("البائع يقدر يبدّل بين الداشبورد وعرض المتجر", async ({ page }) => {
  await login(page, VENDOR);
  await expect(page).toHaveURL("/vendor/dashboard");

  await page.getByRole("link", { name: "عرض المتجر" }).first().click();
  await expect(page).toHaveURL("/products");

  await page.getByRole("link", { name: "لوحة التحكم" }).click();
  await expect(page).toHaveURL("/vendor/dashboard");
});

test("عميل عادي مفيش عنده زرار لوحة التحكم", async ({ page }) => {
  await login(page, CUSTOMER);
  await expect(page).toHaveURL("/products");
  await expect(page.getByRole("link", { name: "لوحة التحكم" })).toHaveCount(0);
});

test("بائع غير مقبول ما يقدرش يفتح لوحة التاجر", async ({ page }) => {
  await login(page, PENDING_VENDOR);
  await expect(page).toHaveURL("/products");
  await page.goto("/vendor/dashboard");
  await expect(page.getByRole("heading", { name: "غير مصرح لك" })).toBeVisible();
});
