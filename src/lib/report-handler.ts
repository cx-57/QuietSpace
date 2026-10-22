import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import type { ReportInput, ReportReceipt, Result } from "./contracts.ts";
import { parseReportInput } from "./validation.ts";

export interface ReportConfig { origin: string; secret: string; trustedIpHeader: string }
export interface ReportDependencies {
  config: ReportConfig | null;
  now: () => Date;
  submit: (input: ReportInput, abuseKey: string, fingerprint: string) => Promise<Result<ReportReceipt>>;
}
function response(body: unknown, status: number, retryAfter?: string) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", ...(retryAfter ? { "Retry-After": retryAfter } : {}) } });
}
const error = (status: number, code: string, message: string) => response({ ok: false, error: { code, message } }, status);

/** Dependency-injected boundary: exercised with real Request streams and a controlled test sink. */
export async function handleReport(request: Request, deps: ReportDependencies): Promise<Response> {
  const config = deps.config;
  if (!config) return error(503, "setup_required", "Reporting is currently unavailable. Your observation has not been sent.");
  if (request.headers.get("origin") !== config.origin || request.headers.get("sec-fetch-site") === "cross-site") {
    return error(403, "invalid_input", "Please submit from the QuietSpace report page.");
  }
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") return error(415, "invalid_input", "Use a JSON observation.");
  // This header must be overwritten by the trusted ingress. Never trust a visitor-supplied forwarded chain.
  const address = request.headers.get(config.trustedIpHeader)?.trim();
  if (!address || address.includes("%") || !isIP(address)) return error(503, "unavailable", "Reporting is temporarily unavailable. Your observation has not been sent.");
  if (Number(request.headers.get("content-length")) > 2048) return error(413, "invalid_input", "This observation is too large.");
  let payload: unknown;
  try {
    if (!request.body) return error(400, "invalid_input", "An observation is required.");
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 2048) { await reader.cancel(); return error(413, "invalid_input", "This observation is too large."); }
      chunks.push(value);
    }
    payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch { return error(400, "invalid_input", "This observation could not be read. Check your inputs."); }
  const now = deps.now();
  const input = parseReportInput(payload, now);
  if (!input.ok) return response(input, 400);
  // Rotate network pseudonyms daily. Neither raw addresses nor headers leave this handler.
  const digest = (value: string) => createHmac("sha256", config.secret).update(value).digest("hex");
  // Group IPv6 privacy addresses by /64 so changing the interface ID cannot reset limits.
  const network = address.includes(":") ? ipv6Network(address) : address;
  const abuseKey = digest(`${now.toISOString().slice(0, 10)}:${network}`);
  const fingerprint = digest(`${abuseKey}:${JSON.stringify(input.value)}`);
  try {
    const result = await deps.submit(input.value, abuseKey, fingerprint);
    if (!result.ok) return response(result, result.error.code === "rate_limited" ? 429 : result.error.code === "not_found" ? 404 : 503,
      result.error.code === "rate_limited" ? "60" : undefined);
    return response(result, 202);
  } catch { return error(503, "unavailable", "We could not confirm submission. Keep your inputs and try again later; repeated observations are limited."); }
}

function ipv6Network(address: string): string {
  // WHATWG URL canonicalizes compressed forms; pad to retain the network prefix only.
  let normalized = new URL(`http://[${address}]/`).hostname.slice(1, -1);
  const groups = normalized.split("::");
  if (groups.length === 2) {
    const left = groups[0] ? groups[0].split(":") : [];
    const right = groups[1] ? groups[1].split(":") : [];
    normalized = [...left, ...Array(8 - left.length - right.length).fill("0"), ...right].join(":");
  }
  return normalized.split(":").slice(0, 4).map(part => part.padStart(4, "0")).join(":");
}
