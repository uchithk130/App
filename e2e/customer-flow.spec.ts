import { test, expect } from "@playwright/test";

test.describe("Customer core flow", () => {
  test.beforeEach(async ({ page, baseURL }) => {
    test.skip(!baseURL?.includes("3000"), "customer project only");
    await page.context().addCookies([
      {
        name: "kcal_onboarded",
        value: "1",
        url: baseURL ?? "http://127.0.0.1:3000",
      },
    ]);
  });

  test("browse meals shows grid skeleton empty or error", async ({ page }) => {
    await page.goto("/meals");
    const any = page.getByTestId("meal-grid").or(page.getByTestId("meals-empty")).or(page.getByTestId("meals-skeleton")).or(page.getByTestId("meals-error"));
    await expect(any).toBeVisible({ timeout: 45_000 });
  });

  test("register then land on meals", async ({ page }) => {
    await page.goto("/register");
    const email = `e2e_${Date.now()}@fitmeals.dev`;
    await page.getByTestId("customer-fullname").fill("E2E User");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("Password123!");
    await page.getByTestId("customer-register-submit").click();
    await page.waitForURL((u) => {
      try {
        return new URL(u).pathname === "/";
      } catch {
        return false;
      }
    }, { timeout: 45_000 });
  });

  test("seed customer checkout with mock Razorpay verify", async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("customer-email").fill("alex@fitmeals.dev");
    await page.getByTestId("customer-password").fill("Password123!");
    await page.getByTestId("customer-login-submit").click();
    await page.waitForURL((u) => {
      try {
        return new URL(u).pathname === "/";
      } catch {
        return false;
      }
    }, { timeout: 45_000 });

    await page.goto("/meals");
    await page.getByTestId("meal-link").first().click({ timeout: 30_000 });
    await page.getByTestId("add-to-cart").click();
    await page.waitForURL(/\/cart/, { timeout: 30_000 });
    await page.getByTestId("checkout-cta").click();
    await page.getByTestId("checkout-pay").click();
    await expect(page.getByRole("heading", { name: /Orders/i })).toBeVisible({ timeout: 45_000 });
  });
});
