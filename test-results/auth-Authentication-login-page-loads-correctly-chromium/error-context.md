# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication >> login page loads correctly
- Location: e2e\auth.spec.ts:4:7

# Error details

```
Error: expect(page).toHaveTitle(expected) failed

Expected pattern: /Navexa AI/
Received string:  "Login – Vercel"
Timeout: 5000ms

Call log:
  - Expect "toHaveTitle" with timeout 5000ms
    13 × unexpected value "Login – Vercel"

```

```yaml
- link "Skip to content":
  - /url: "#geist-skip-nav"
- banner:
  - link "Vercel logo":
    - /url: /home
    - button "Vercel Logo":
      - img "Vercel Logo"
  - navigation:
    - navigation:
      - link "Sign Up":
        - /url: /signup?next=%2Fsso-api%3Furl%3Dhttps%253A%252F%252Fnavexa-ai-git-main-tishas-projects-a05cea24.vercel.app%252Flogin%26nonce%3D5f961a59179cbbb4f9258b1adebcaa8ee5e95e9a3a636cfeace1c16c7f20c2c1
        - paragraph: Sign Up
- main:
  - heading "Log in to Vercel" [level=1]
  - textbox "Email Address"
  - button "Continue with Email"
  - button "Continue with Google":
    - img
    - text: Continue with Google
  - button "Continue with GitHub":
    - img
    - text: Continue with GitHub
  - button "Continue with Apple":
    - img
    - text: Continue with Apple
  - button "Continue with SAML SSO":
    - img
    - text: Continue with SAML SSO
  - button "Continue with Passkey":
    - img
    - text: Continue with Passkey
  - button "Show other options"
  - paragraph:
    - text: Don't have an account?
    - link "Sign Up":
      - /url: /signup?next=%2Fsso-api%3Furl%3Dhttps%253A%252F%252Fnavexa-ai-git-main-tishas-projects-a05cea24.vercel.app%252Flogin%26nonce%3D5f961a59179cbbb4f9258b1adebcaa8ee5e95e9a3a636cfeace1c16c7f20c2c1
  - link "Terms":
    - /url: /legal/terms
  - link "Privacy Policy":
    - /url: /legal/privacy-policy
- alert
- img
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test.describe("Authentication", () => {
  4  |   test("login page loads correctly", async ({ page }) => {
  5  |     await page.goto("/login");
  6  | 
> 7  |     await expect(page).toHaveTitle(/Navexa AI/);
     |                        ^ Error: expect(page).toHaveTitle(expected) failed
  8  |     await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  9  |     await expect(page.getByLabel("Email")).toBeVisible();
  10 |     await expect(page.getByLabel("Password")).toBeVisible();
  11 |     await expect(page.getByRole("button", { name: /Log in/i })).toBeVisible();
  12 |   });
  13 | 
  14 |   test("unauthenticated user is redirected to login", async ({ page }) => {
  15 |     await page.goto("/dashboard");
  16 | 
  17 |     await expect(page).toHaveURL(/\/login/);
  18 |   });
  19 | 
  20 |   test("valid credentials redirect to dashboard", async ({ page }) => {
  21 |     const email = process.env.TEST_EMAIL ?? "aryan@gmail.com";
  22 |     const password = process.env.TEST_PASSWORD ?? "Aryan@1234";
  23 | 
  24 |     await page.goto("/login");
  25 |     await page.getByLabel("Email").fill(email);
  26 |     await page.getByLabel("Password").fill(password);
  27 |     await page.getByRole("button", { name: /Log in/i }).click();
  28 | 
  29 |     await page.waitForURL(/\/(dashboard|admin)/, { timeout: 15_000 });
  30 |     const url = page.url();
  31 |     expect(url).toMatch(/\/(dashboard|admin)/);
  32 |   });
  33 | });
  34 | 
```