import "server-only";
import type { ReportConfig } from "../report-handler.ts";
import type { ReportInput, ReportReceipt, Result } from "../contracts.ts";
import { object, UUID_PATTERN } from "../public-data.ts";
import { publicConfig } from "./directory.ts";
import { submitPostgresReport } from "./postgres.ts";

export function reportConfig(): ReportConfig | null {
  try {
    if (process.env.REPORTS_ENABLED !== "true") return null;
    const mode = process.env.QUIETSPACE_DATA_MODE;
    if (mode === "postgres" ? !process.env.DATABASE_URL : mode !== "supabase" || !publicConfig() || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
    const origin = process.env.APP_ORIGIN;
    const secret = process.env.REPORT_ABUSE_SECRET;
    const loopback = process.env.NODE_ENV === "development" && mode === "postgres" && origin && ["localhost", "127.0.0.1"].includes(new URL(origin).hostname);
    const trustedIpHeader = process.env.REPORT_TRUSTED_IP_HEADER?.toLowerCase() || (loopback ? "x-quietspace-local-bucket" : undefined);
    if (!origin || !secret || secret.length < 32 || !trustedIpHeader || !/^[a-z0-9-]+$/.test(trustedIpHeader)) return null;
    const parsed = new URL(origin);
    if (parsed.origin !== origin || (parsed.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && ["localhost", "127.0.0.1"].includes(parsed.hostname)))) return null;
    return { origin, secret, trustedIpHeader };
  } catch { return null; }
}

export async function submitReport(input: ReportInput, abuseKey: string, fingerprint: string): Promise<Result<ReportReceipt>> {
  if (process.env.QUIETSPACE_DATA_MODE === "postgres") return submitPostgresReport(input, abuseKey, fingerprint);
  const unavailable: Result<ReportReceipt> = { ok: false, error: { code: "unavailable", message: "We could not confirm submission. Please try again later; repeated observations are limited." } };
  const config = publicConfig();
  if (!config) return unavailable;
  const response = await fetch(`${config.url}/rest/v1/rpc/submit_rate_limited_report`, {
    method: "POST", cache: "no-store", signal: AbortSignal.timeout(8000),
    headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_space_id: input.spaceId, p_observed_at: input.observedAt,
      p_noise: input.intensities.noise, p_crowds: input.intensities.crowds, p_brightness: input.intensities.brightness, p_scent: input.intensities.scent,
      p_abuse_key: abuseKey, p_fingerprint: fingerprint }),
  });
  const value: unknown = await response.json();
  if (!response.ok) {
    const failure = object(value);
    if (failure.code === "P0429") return { ok: false, error: { code: "rate_limited", message: "This observation was repeated or the submission limit was reached. Wait before sending another observation." } };
    if (failure.code === "22023") return { ok: false, error: { code: "not_found", message: "This venue or observation time is no longer available. Check the venue and visit time." } };
    return unavailable;
  }
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) return unavailable;
  return { ok: true, value: { id: value, status: "pending" } };
}
