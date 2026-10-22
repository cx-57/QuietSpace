import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// These tests exercise real Next routes against a loopback TEST DOUBLE, never PostgreSQL/RLS.
test.beforeEach(async ({ request }) => { await request.get("http://127.0.0.1:3987/__test/reset"); });

test("keyboard report validation, preserved errors, pending-only visibility and refreshed approval", async ({ page, request }) => {
  await page.setExtraHTTPHeaders({ "x-test-verified-ip": "192.0.2.1" });
  await page.goto("/preferences");
  await page.getByLabel("Noise", { exact: true }).selectOption("2");
  await page.getByLabel("Crowds", { exact: true }).selectOption("3");
  await page.getByLabel("Brightness", { exact: true }).selectOption("3");
  await page.goto("/spaces/sample-test-library/report");
  await expect(page.getByRole("button", { name: "Send for review" })).toBeEnabled();
  const violations = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(violations.violations).toEqual([]);
  await page.getByRole("button", { name: "Send for review" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("alert", { name: "Check your observation" })).toBeFocused();
  await expect(page.getByRole("alert", { name: "Check your observation" })).toContainText("visit date and time");
  const localVisit = await page.evaluate(() => {
    const visit = new Date(Date.now() - 3600000);
    return new Date(visit.getTime() - visit.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });
  await page.getByLabel("When did you visit?").fill(localVisit);
  await page.getByRole("button", { name: "Send for review" }).click();
  await expect(page.getByRole("alert", { name: "Check your observation" })).toContainText("at least one dimension");
  await page.getByLabel("Noise", { exact: true }).selectOption("2");
  await page.getByLabel("Crowds", { exact: true }).selectOption("2");
  await page.getByLabel("Brightness", { exact: true }).selectOption("3");
  // A network failure leaves the form intact.
  await page.route("**/api/reports", route => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ ok: false, error: { code: "unavailable", message: "SAMPLE temporary failure" } }) }));
  await page.getByRole("button", { name: "Send for review" }).click();
  await expect(page.getByRole("alert", { name: "Check your observation" })).toContainText("SAMPLE temporary failure");
  await expect(page.getByLabel("Noise", { exact: true })).toHaveValue("2");
  await expect(page.getByLabel("When did you visit?")).toHaveValue(localVisit);
  await page.unroute("**/api/reports");
  await page.getByRole("button", { name: "Send for review" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Thank you. Your report is awaiting review." })).toBeVisible();
  expect((await (await request.get("http://127.0.0.1:3987/__test/state")).json()).pending).toBe(1);
  await page.getByRole("link", { name: "Return to venue", exact: true }).click();
  await expect(page.getByText("2 approved observations in the last 60 days")).toBeVisible();
  await expect(page.getByText("Not enough evidence for a match", { exact: true })).toBeVisible();
  // Simulated trusted moderation is confined to the test-double process.
  await request.get("http://127.0.0.1:3987/__test/approve");
  await page.reload();
  await expect(page.getByText("3 approved observations in the last 60 days")).toBeVisible();
  await expect(page.getByText("100/100", { exact: false })).toBeVisible();
  await page.getByRole("link", { name: "← All places" }).click();
  await expect(page.getByRole("article").getByText("100/100", { exact: false })).toBeVisible();
});

test("real HTTP route rejects escalation and wrong origin, and maps duplicate errors", async ({ request }) => {
  const payload = { spaceId: "10000000-0000-4000-8000-000000000001", observedAt: new Date().toISOString(), intensities: { noise: 2, crowds: null, brightness: null, scent: null } };
  const headers = { origin: "http://127.0.0.1:3101", "x-test-verified-ip": "192.0.2.2" };
  expect((await request.post("/api/reports", { headers, data: { ...payload, status: "approved" } })).status()).toBe(400);
  expect((await request.post("/api/reports", { headers: { ...headers, origin: "https://evil.example" }, data: payload })).status()).toBe(403);
  expect((await request.post("/api/reports", { headers, data: payload })).status()).toBe(202);
  const duplicate = await request.post("/api/reports", { headers, data: payload });
  expect(duplicate.status()).toBe(429);
  expect(duplicate.headers()["retry-after"]).toBe("60");
});

test("public data outage has an honest recoverable state", async ({ page, request }) => {
  await request.get("http://127.0.0.1:3987/__test/outage");
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "The directory is unavailable", exact: true })).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(0);
  await request.get("http://127.0.0.1:3987/__test/reset");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("article")).toHaveCount(1);
});
