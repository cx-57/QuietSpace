// TEST ONLY: loopback PostgREST stand-in. No real database, credentials or venue observations.
import http from "node:http";
import { randomUUID } from "node:crypto";
const id = "10000000-0000-4000-8000-000000000001";
const source = "https://example.org/sample-only";
let reports = [], unavailable = false;
function reset() {
  unavailable = false;
  reports = Array.from({ length: 2 }, () => ({ id: randomUUID(), space_id: id, observed_at: new Date(Date.now() - 86400000).toISOString(), created_at: new Date().toISOString(), noise: 2, crowds: 2, brightness: 3, scent: null, status: "approved", is_fixture: false }));
}
reset();
const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, "http://127.0.0.1:3987");
  const send = (value, status = 200, total) => {
    response.writeHead(status, { "Content-Type": "application/json", ...(total !== undefined ? { "Content-Range": `0-${Math.max(0, total - 1)}/${total}` } : {}) });
    response.end(JSON.stringify(value));
  };
  if (url.pathname === "/__test/reset") { reset(); return send({ ok: true }); }
  if (url.pathname === "/__test/approve") { reports.forEach(r => { r.status = "approved"; }); return send({ ok: true }); }
  if (url.pathname === "/__test/outage") { unavailable = true; return send({ ok: true }); }
  if (url.pathname === "/__test/state") return send({ pending: reports.filter(r => r.status === "pending").length });
  if (url.pathname === "/health") return send({ ok: true });
  if (unavailable) return send({ code: "SAMPLE_OUTAGE" }, 503);
  if (url.pathname.startsWith("/rest/v1/rpc/")) {
    if (request.headers.apikey !== "SAMPLE_TEST_SERVER_KEY") return send({}, 403);
    let body = "";
    for await (const chunk of request) body += chunk;
    const payload = JSON.parse(body);
    if (reports.some(r => r.status === "pending")) return send({ code: "P0429" }, 400);
    if (payload.p_space_id !== id) return send({ code: "22023" }, 400);
    const report = { id: randomUUID(), space_id: id, observed_at: payload.p_observed_at, created_at: new Date().toISOString(), noise: payload.p_noise, crowds: payload.p_crowds, brightness: payload.p_brightness, scent: payload.p_scent, status: "pending", is_fixture: false };
    reports.push(report);
    return send(report.id);
  }
  if (request.headers.apikey !== "SAMPLE_TEST_PUBLIC_KEY") return send({ code: "PUBLIC_READ_USED_WRONG_KEY" }, 403);
  if (url.pathname === "/rest/v1/spaces") {
    const rows = [{ id, slug: "sample-test-library", name: "SAMPLE Test Library", address: "SAMPLE Boston address", category: "library", latitude: null, longitude: null,
      time_zone: "America/New_York", public_access: "public", source_url: source, source_evidence: "SAMPLE test fixture; never a real venue claim.", checked_at: new Date(Date.now() - 86400000).toISOString(), published: true, provenance_status: "verified", is_fixture: false }];
    const found = url.searchParams.has("slug") && url.searchParams.get("slug") !== "eq.sample-test-library" ? [] : rows;
    return send(found, 200, found.length);
  }
  if (url.pathname === "/rest/v1/public_space_features") return send([], 200, 0);
  if (url.pathname === "/rest/v1/sensory_reports") {
    // Intentionally return pending rows too: production adapter must still discard them.
    return send(reports, 200, reports.length);
  }
  return send({}, 404);
});
server.listen(3987, "127.0.0.1");
