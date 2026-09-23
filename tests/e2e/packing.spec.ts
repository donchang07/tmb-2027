import { expect, test } from "@playwright/test";

test("checked packing items persist across reload on the same device (FR-015, SC-011)", async ({ page }) => {
  await page.goto("/packing");
  const first = page.locator("input[data-item-id='docs-passport']");
  await expect(first).toBeEnabled();
  await first.check();
  await expect(first).toBeChecked();
  await expect(page.getByTestId("packing-progress")).toContainText("1/");

  await page.reload();
  const again = page.locator("input[data-item-id='docs-passport']");
  await expect(again).toBeEnabled();
  await expect(again).toBeChecked();
  await expect(page.getByTestId("packing-progress")).toContainText("1/");

  await page.getByRole("button", { name: "전체 해제" }).click();
  await expect(page.getByTestId("packing-progress")).toContainText("0/");
  await page.reload();
  await expect(page.locator("input[data-item-id='docs-passport']")).toBeEnabled();
  await expect(page.locator("input[data-item-id='docs-passport']")).not.toBeChecked();
});
