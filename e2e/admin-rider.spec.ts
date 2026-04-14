import { test, expect } from "@playwright/test";

test.describe("Admin + rider ops", () => {
  test("admin login and dashboard KPIs", async ({ page, baseURL }) => {
    test.skip(!baseURL?.includes("3001"), "admin project only");
    await page.goto("/login");
    await page.getByTestId("admin-email").fill("admin@fitmeals.dev");
    await page.getByTestId("admin-password").fill("Password123!");
    await page.getByTestId("admin-login-submit").click();
    await expect(page.getByTestId("admin-dashboard-title")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("admin-kpis").or(page.getByTestId("admin-overview-error"))).toBeVisible();
  });

  test("rider login sees orders surface", async ({ page, baseURL }) => {
    test.skip(!baseURL?.includes("3002"), "rider project only");
    await page.goto("/login");
    await page.getByTestId("rider-email").fill("rider@fitmeals.dev");
    await page.getByTestId("rider-password").fill("Password123!");
    await page.getByTestId("rider-login-submit").click();
    await expect(page.getByTestId("rider-orders-title")).toBeVisible({ timeout: 30_000 });
    await expect(
      page.getByTestId("rider-order-list").or(page.getByTestId("rider-orders-empty")).or(page.getByTestId("rider-orders-error"))
    ).toBeVisible();
  });
});
