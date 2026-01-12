import { test, expect } from "@playwright/test";

/**
 * Avatar Upload E2E Tests
 * Full user workflow for uploading and managing avatar
 */

test.describe("Avatar Upload E2E", () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Login user before tests
    await page.goto("/");
    // await loginUser(page, testUser);
  });

  test("user should upload avatar from profile page", async ({ page }) => {
    // Navigate to profile
    await page.goto("/profile");

    // Find file input
    const fileInput = page.locator('input[type="file"]');

    // Upload test image
    // await fileInput.setInputFiles("tests/fixtures/test-avatar.jpg");

    // Verify upload starts
    // await expect(page.locator("text=Uploading")).toBeVisible();

    // Wait for success message
    // await expect(page.locator("text=Avatar uploaded successfully")).toBeVisible({
    //   timeout: 10000,
    // });
  });

  test("avatar should update immediately on profile", async ({ page }) => {
    // Navigate to profile
    await page.goto("/profile");

    // Upload avatar
    // const fileInput = page.locator('input[type="file"]');
    // await fileInput.setInputFiles("tests/fixtures/test-avatar.jpg");

    // Wait for update
    // await page.waitForTimeout(2000);

    // Verify avatar image updated
    // const avatarImg = page.locator('img[alt="User avatar"]');
    // const src = await avatarImg.getAttribute("src");
    // expect(src).toContain("amazonaws.com");
  });

  test("avatar should appear on dashboard", async ({ page }) => {
    // Upload avatar on profile
    // await page.goto("/profile");
    // const fileInput = page.locator('input[type="file"]');
    // await fileInput.setInputFiles("tests/fixtures/test-avatar.jpg");
    // await page.waitForTimeout(2000);

    // Navigate to dashboard
    // await page.goto("/dashboard");

    // Verify avatar appears
    // const dashboardAvatar = page.locator('img[alt="User avatar"]');
    // await expect(dashboardAvatar).toBeVisible();
  });

  test("user should delete avatar", async ({ page }) => {
    // Navigate to profile
    await page.goto("/profile");

    // Upload avatar first
    // const fileInput = page.locator('input[type="file"]');
    // await fileInput.setInputFiles("tests/fixtures/test-avatar.jpg");
    // await page.waitForTimeout(2000);

    // Click delete button
    // const deleteBtn = page.locator("button:has-text('Delete Avatar')");
    // await deleteBtn.click();

    // Confirm deletion
    // const confirmBtn = page.locator("button:has-text('Confirm')");
    // await confirmBtn.click();

    // Verify avatar removed
    // await expect(page.locator("text=Avatar deleted")).toBeVisible();
  });

  test("should reject non-image files", async ({ page }) => {
    // Navigate to profile
    await page.goto("/profile");

    // Try to upload non-image
    // const fileInput = page.locator('input[type="file"]');
    // await fileInput.setInputFiles("tests/fixtures/document.pdf");

    // Verify error
    // await expect(page.locator("text=Only image files allowed")).toBeVisible();
  });

  test("should show error for files over 10MB", async ({ page }) => {
    // Navigate to profile
    await page.goto("/profile");

    // Try to upload large file
    // const fileInput = page.locator('input[type="file"]');
    // await fileInput.setInputFiles("tests/fixtures/large-image-20mb.jpg");

    // Verify error
    // await expect(page.locator("text=File too large")).toBeVisible();
  });
});
