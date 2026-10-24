import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("preferences persist through reload and details; search, strict filters and reset work", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("article")).toHaveCount(5);
  await page.getByLabel("Place name or area").fill("Brighton");
  await expect(page.getByRole("article")).toHaveCount(1);
  await page.getByRole("link", { name: "Edit sensory preferences" }).click();
  await page.getByLabel("Noise", { exact: true }).selectOption("2");
  await page.getByLabel("Brightness", { exact: true }).selectOption("3");
  await page.reload();
  await expect(page.getByLabel("Noise", { exact: true })).toHaveValue("2");
  await page.getByRole("link", { name: "Explore with these preferences" }).click();
  await page.getByRole("checkbox", { name: "Step-free access" }).check();
  await expect(page.getByText("No places meet these filters")).toBeVisible();
  await page.getByRole("checkbox", { name: "Step-free access" }).uncheck();
  await page.getByRole("checkbox", { name: "Accessible entrance" }).check();
  await expect(page.getByRole("article")).toHaveCount(5);
  await page.getByRole("link", { name: "Brighton Branch", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Brighton Branch");
  await expect(page.getByText("Not enough evidence for a match", { exact: true })).toBeVisible();
  await expect(page.getByText("No recent community observations", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Adjust your preferences" }).click();
  await expect(page.getByLabel("Noise", { exact: true })).toHaveValue("2");
  await page.getByRole("button", { name: "Reset preferences" }).click();
  await expect(page.getByLabel("Noise", { exact: true })).toHaveValue("");
  await expect(page.getByRole("checkbox", { name: "Accessible entrance" })).not.toBeChecked();
  expect(await page.evaluate(() => localStorage.getItem("quietspace.preferences.v1"))).toBeNull();
});

test("malformed saved preferences recover, and disabled storage keeps session preferences", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("quietspace.preferences.v1", "broken"));
  await page.goto("/preferences");
  await expect(page.getByText(/Saved preferences could not be read/)).toBeVisible();
  await page.getByLabel("Noise", { exact: true }).selectOption("1");
  await expect(page.getByText(/Saved preferences could not be read/)).toHaveCount(0);
  const context = await page.context().browser()!.newContext();
  const blocked = await context.newPage();
  await blocked.addInitScript(() => { Object.defineProperty(window, "localStorage", { get() { throw new DOMException("Storage blocked", "SecurityError"); } }); });
  await blocked.goto("http://127.0.0.1:3100/preferences");
  await expect(blocked.getByText(/Browser storage is unavailable/)).toBeVisible();
  await blocked.getByLabel("Noise", { exact: true }).selectOption("1");
  await blocked.getByRole("link", { name: "Explore with these preferences" }).click();
  await blocked.getByRole("link", { name: "Edit sensory preferences" }).click();
  await expect(blocked.getByLabel("Noise", { exact: true })).toHaveValue("1");
  await context.close();
});

test("keyboard skip link, 320px layouts and automated accessibility on core routes", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
  for (const route of ["/", "/preferences", "/spaces/bpl-brighton", "/spaces/bpl-brighton/report", "/spaces/does-not-exist", "/about", "/privacy", "/credits"]) {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(result.violations.map(v => `${v.id}: ${v.description}`)).toEqual([]);
  }
  expect(errors).toEqual([]);
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto("/");
  await page.screenshot({ path: "artifacts/release-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 320, height: 800 });
  await page.screenshot({ path: "artifacts/release-mobile.png", fullPage: true });
});

test("mobile filter disclosure and reduced-motion/forced-color reflow stay usable", async ({page})=>{
  await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:"reduce",forcedColors:"active"});
  await page.goto("/");
  const toggle=page.getByRole("button",{name:"Your space, your way"});
  await expect(toggle).toHaveAttribute("aria-expanded","false");
  await toggle.click();await page.getByRole("checkbox",{name:"Step-free access"}).check();
  await expect(page.getByText("No places meet these filters")).toBeVisible();
  await toggle.click();await expect(toggle).toBeFocused();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.setViewportSize({width:640,height:450});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test("missing venues are 404s, curated reports are unavailable and API fails closed", async ({ page, request }) => {
  expect((await page.goto("/spaces/does-not-exist"))?.status()).toBe(404);
  expect((await page.goto("/spaces/does-not-exist/report"))?.status()).toBe(404);
  await page.goto("/spaces/bpl-brighton/report");
  await expect(page.getByText("Reporting is not available in this directory yet")).toBeVisible();
  await expect(page.getByRole("button", { name: "Send for review" })).toHaveCount(0);
  const response = await request.post("/api/reports", { data: { status: "approved" } });
  expect(response.status()).toBe(503);
  expect((await response.json()).error.code).toBe("setup_required");
});
