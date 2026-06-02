# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication >> valid credentials redirect to dashboard
- Location: e2e\auth.spec.ts:20:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByLabel('Password')

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - link "Skip to content":
    - /url: "#geist-skip-nav"
  - generic [ref=e3]:
    - banner [ref=e4]:
      - link "Vercel logo":
        - /url: /home
        - button "Vercel Logo":
          - img "Vercel Logo"
      - navigation [ref=e5]:
        - navigation [ref=e6]:
          - link "Sign Up" [ref=e7] [cursor=pointer]:
            - /url: /signup?next=%2Fsso-api%3Furl%3Dhttps%253A%252F%252Fnavexa-ai-git-main-tishas-projects-a05cea24.vercel.app%252Flogin%26nonce%3D92c9edbf938a72ca8dff89c17d13c5d95df090648148171db92c6cb0664efe7f
            - paragraph [ref=e9]: Sign Up
    - main [ref=e10]:
      - generic [ref=e12]:
        - heading "Log in to Vercel" [level=1] [ref=e15]
        - generic [ref=e16]:
          - generic [ref=e17]:
            - textbox "Email Address" [active] [ref=e19]: aryan@gmail.com
            - button "Continue with Email" [ref=e21] [cursor=pointer]:
              - generic [ref=e22]: Continue with Email
          - generic [ref=e24]:
            - button "Continue with Google" [ref=e25] [cursor=pointer]:
              - img [ref=e28]
              - generic [ref=e34]: Continue with Google
            - button "Continue with GitHub" [ref=e35] [cursor=pointer]:
              - img [ref=e37]
              - generic [ref=e41]: Continue with GitHub
            - button "Continue with Apple" [ref=e42] [cursor=pointer]:
              - img [ref=e44]
              - generic [ref=e47]: Continue with Apple
            - button "Continue with SAML SSO" [ref=e49] [cursor=pointer]:
              - img [ref=e51]
              - generic [ref=e53]: Continue with SAML SSO
            - button "Continue with Passkey" [ref=e54] [cursor=pointer]:
              - img [ref=e56]
              - generic [ref=e58]: Continue with Passkey
            - button "Show other options" [ref=e59] [cursor=pointer]:
              - generic [ref=e60]: Show other options
        - paragraph [ref=e62]:
          - text: Don't have an account?
          - link "Sign Up" [ref=e63] [cursor=pointer]:
            - /url: /signup?email=aryan%40gmail.com&next=%2Fsso-api%3Furl%3Dhttps%253A%252F%252Fnavexa-ai-git-main-tishas-projects-a05cea24.vercel.app%252Flogin%26nonce%3D92c9edbf938a72ca8dff89c17d13c5d95df090648148171db92c6cb0664efe7f
      - generic [ref=e66]:
        - link "Terms" [ref=e67] [cursor=pointer]:
          - /url: /legal/terms
        - link "Privacy Policy" [ref=e68] [cursor=pointer]:
          - /url: /legal/privacy-policy
  - alert [ref=e69]
  - generic:
    - generic:
      - generic:
        - generic:
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
  7  |     await expect(page).toHaveTitle(/Navexa AI/);
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
> 26 |     await page.getByLabel("Password").fill(password);
     |                                       ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  27 |     await page.getByRole("button", { name: /Log in/i }).click();
  28 | 
  29 |     await page.waitForURL(/\/(dashboard|admin)/, { timeout: 15_000 });
  30 |     const url = page.url();
  31 |     expect(url).toMatch(/\/(dashboard|admin)/);
  32 |   });
  33 | });
  34 | 
```