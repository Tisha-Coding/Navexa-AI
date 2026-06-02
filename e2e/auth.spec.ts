import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("login page loads correctly", async ({ page }) => {
    await page.goto("/login");

    await expect(page).toHaveTitle(/Navexa AI/);
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /Log in/i })).toBeVisible();
  });

  test("unauthenticated user is redirected to login", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/login/);
  });

  test("valid credentials redirect to dashboard", async ({ page }) => {
    const email = process.env.TEST_EMAIL ?? "aryan@gmail.com";
    const password = process.env.TEST_PASSWORD ?? "Aryan123@#";

    await page.goto("/login");
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.getByRole("button", { name: /Log in/i }).click();

    await page.waitForURL(/\/(dashboard|admin)/, { timeout: 15_000 });
    const url = page.url();
    expect(url).toMatch(/\/(dashboard|admin)/);
  });
});
