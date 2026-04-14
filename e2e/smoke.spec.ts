import { test, expect } from "@playwright/test";

test.describe("Smoke", () => {
  test("customer home renders hero", async ({ page, baseURL }) => {
    test.skip(!baseURL?.includes("3000"), "customer project only");
    await page.goto("/");
    await expect(page.getByTestId("hero-browse")).toBeVisible();
  });

  test("admin login form visible", async ({ page, baseURL }) => {
    test.skip(!baseURL?.includes("3001"), "admin project only");
    await page.goto("/login");
    await expect(page.getByTestId("admin-login-form")).toBeVisible();
  });

  test("rider login form visible (mobile)", async ({ page, baseURL }) => {
    test.skip(!baseURL?.includes("3002"), "rider project only");
    await page.goto("/login");
    await expect(page.getByTestId("rider-login-form")).toBeVisible();
  });
});
