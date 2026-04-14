import { test, expect } from "@playwright/test";

/** Minimal valid PNG (1×1). */
const PNG_1x1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

test.describe("Admin meal image upload", () => {
  test("uploads image after login (mock or S3)", async ({ page, baseURL }) => {
    test.skip(!baseURL?.includes("3001"), "admin app only");

    await page.goto("/login");
    await page.getByTestId("admin-email").fill("admin@fitmeals.dev");
    await page.getByTestId("admin-password").fill("Password123!");
    await page.getByTestId("admin-login-submit").click();
    await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 30_000 });

    await page.goto("/meals/new");
    await page.getByTestId("meal-image-file-input").setInputFiles({
      name: "tiny.png",
      mimeType: "image/png",
      buffer: PNG_1x1,
    });

    await expect(page.getByRole("img", { name: "Preview" })).toBeVisible({ timeout: 30_000 });
    const src = await page.getByRole("img", { name: "Preview" }).getAttribute("src");
    expect(src).toBeTruthy();
    expect(src).toMatch(/^https?:\/\//);
  });
});
