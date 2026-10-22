import assert from "node:assert/strict";
import test from "node:test";
import { handleReport } from "../src/lib/report-handler.ts";
import type { ReportDependencies } from "../src/lib/report-handler.ts";
import { parseReportInput } from "../src/lib/validation.ts";
const now = new Date("2026-10-22T18:00:00Z");
const origin = "https://quietspace.example";
const valid = { spaceId: "10000000-0000-4000-8000-000000000001", observedAt: "2026-10-22T12:00:00-04:00", intensities: { noise: 2, crowds: null, brightness: 3, scent: null } };
const config = { origin, secret: "SAMPLE test secret only with at least 32 characters", trustedIpHeader: "x-test-verified-ip" };
const request = (payload: unknown = valid, headers: Record<string, string> = {}) => new Request(`${origin}/api/reports`, { method: "POST", headers: { origin, "content-type": "application/json", "x-test-verified-ip": "192.0.2.1", ...headers }, body: JSON.stringify(payload) });
const base: ReportDependencies = { config, now: () => now, submit: async () => ({ ok: true, value: { id: valid.spaceId, status: "pending" } }) };

test("valid partial report is pending; only normalized allowlist reaches the sink", async () => {
  let calls = 0;
  const response = await handleReport(request(), { ...base, submit: async (input, abuseKey, fingerprint) => {
    calls++;
    assert.equal(input.observedAt, "2026-10-22T16:00:00.000Z");
    assert.equal(input.intensities.crowds, null);
    assert.match(abuseKey, /^[a-f0-9]{64}$/); assert.match(fingerprint, /^[a-f0-9]{64}$/);
    assert.ok(!JSON.stringify(input).includes("192.0.2.1"));
    return base.submit(input, abuseKey, fingerprint);
  } });
  assert.equal(response.status, 202); assert.equal(calls, 1);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal((await response.json()).value.status, "pending");
});
test("disabled configuration and missing/forged ingress address fail before writes", async () => {
  let called = false;
  const submit: ReportDependencies["submit"] = async () => { called = true; throw new Error("must not run"); };
  assert.equal((await handleReport(request(), { ...base, config: null, submit })).status, 503);
  for (const ip of ["", "forged", "192.0.2.1, 192.0.2.2", "fe80::1%eth0"]) assert.equal((await handleReport(request(valid, { "x-test-verified-ip": ip }), { ...base, submit })).status, 503);
  assert.equal(called, false);
});
test("cross-origin, absent origin, cross-site and wrong content type are rejected", async () => {
  for (const headers of [{ origin: "https://evil.example" }, { origin: "" }, { "sec-fetch-site": "cross-site" }] as Record<string, string>[]) assert.equal((await handleReport(request(valid, headers), base)).status, 403);
  assert.equal((await handleReport(request(valid, { "content-type": "text/plain" }), base)).status, 415);
});
test("oversized streamed payloads and invalid JSON are bounded and rejected", async () => {
  assert.equal((await handleReport(request({ text: "x".repeat(2100) }), base)).status, 413);
  assert.equal((await handleReport(request(valid, { "content-length": "5000" }), base)).status, 413);
  const bad = new Request(`${origin}/api/reports`, { method: "POST", headers: { origin, "content-type": "application/json", "x-test-verified-ip": "192.0.2.1" }, body: "{broken" });
  assert.equal((await handleReport(bad, base)).status, 400);
});
test("privilege escalation, malformed ratings, empty reports, bad IDs and unreasonable dates never reach storage", async () => {
  let calls = 0;
  const deps: ReportDependencies = { ...base, submit: async () => { calls++; throw new Error("must not run"); } };
  const inputs = [
    ...["status", "moderatedAt", "createdAt", "isFixture", "published", "diagnosis", "__proto__"].map(key => ({ ...valid, [key]: "approved" })),
    ...[0, 6, 1.5, "2", true].map(noise => ({ ...valid, intensities: { ...valid.intensities, noise } })),
    { ...valid, intensities: { noise: null, crowds: null, brightness: null, scent: null } },
    { ...valid, spaceId: "any-place" }, { ...valid, observedAt: "2026-01-01T00:00:00Z" }, { ...valid, observedAt: "2026-10-23T00:00:00Z" },
  ];
  for (const input of inputs) assert.equal((await handleReport(request(input), deps)).status, 400);
  assert.equal(calls, 0);
});
test("duplicate/rate-limit, removed venue and server failures have safe, distinct errors", async () => {
  for (const [code, status] of [["rate_limited", 429], ["not_found", 404], ["unavailable", 503]] as const) {
    const response = await handleReport(request(), { ...base, submit: async () => ({ ok: false, error: { code, message: "SAMPLE safe error" } }) });
    assert.equal(response.status, status);
    if (status === 429) assert.equal(response.headers.get("retry-after"), "60");
  }
  const response = await handleReport(request(), { ...base, submit: async () => { throw new Error("SECRET database error"); } });
  assert.equal(response.status, 503);
  assert.ok(!(await response.text()).includes("SECRET"));
});
test("HMAC rotates daily, IPv6 /64 stays stable, canonical payload prevents equivalent duplicate variants", async () => {
  const tokens: string[][] = [];
  const deps: ReportDependencies = { ...base, submit: async (input, key, fingerprint) => { tokens.push([key, fingerprint]); return base.submit(input, key, fingerprint); } };
  await handleReport(request(valid, { "x-test-verified-ip": "2001:db8:abcd:1234::1" }), deps);
  await handleReport(request({ ...valid, observedAt: "2026-10-22T16:00:00Z", intensities: { scent: null, brightness: 3, crowds: null, noise: 2 } }, { "x-test-verified-ip": "2001:0db8:abcd:1234:5678::9" }), deps);
  assert.deepEqual(tokens[0], tokens[1]);
  await handleReport(request(valid, { "x-test-verified-ip": "2001:db8:abcd:1234::1" }), { ...deps, now: () => new Date("2026-10-23T00:00:00Z") });
  assert.notEqual(tokens[0][0], tokens[2][0]);
});
test("report parser rejects impossible dates and normalizes ID/timestamps without changing unknowns", () => {
  assert.equal(parseReportInput({ ...valid, observedAt: "2026-09-31T12:00:00Z" }, now).ok, false);
  assert.equal(parseReportInput({ ...valid, observedAt: "2026-10-22T18:05:00Z" }, now).ok, true);
  assert.equal(parseReportInput({ ...valid, observedAt: "2026-10-22T18:05:01Z" }, now).ok, false);
});
