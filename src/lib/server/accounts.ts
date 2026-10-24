import "server-only";
import { mkdirSync, chmodSync } from "node:fs";
import { join } from "node:path";
import { cookies } from "next/headers";
import { CommunityStore } from "./community-store";

export const SESSION_COOKIE = "quietspace_session";
const globalStore = globalThis as typeof globalThis & { quietspaceCommunityV2?: CommunityStore };
export function communityStore() {
  if (!globalStore.quietspaceCommunityV2) {
    const folder = process.env.QUIETSPACE_STORAGE_DIR ?? join(process.cwd(), "artifacts", "community");
    mkdirSync(folder, { recursive: true, mode: 0o700 });
    const path = join(folder, "community.sqlite");
    globalStore.quietspaceCommunityV2 = new CommunityStore(path);
    chmodSync(path, 0o600);
  }
  return globalStore.quietspaceCommunityV2;
}
export async function currentAccount() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? communityStore().session(token) : null;
}
export function sameOrigin(request: Request) {
  try {
    const origin = new URL(request.headers.get("origin") ?? "");
    const url = new URL(request.url);
    // Next's development server can normalize its internal URL to localhost.
    // The browser-facing Host remains the authority for the same-origin check.
    return origin.host === (request.headers.get("host") ?? url.host) && origin.protocol === url.protocol &&
      request.headers.get("sec-fetch-site") !== "cross-site";
  } catch { return false; }
}
export async function readAccountBody(request: Request): Promise<Record<string, unknown>> {
  if (!sameOrigin(request)) throw new Error("Please use the form on this site.");
  if (!request.headers.get("content-type")?.startsWith("application/json")) throw new Error("Use the form on this site.");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Missing form data.");
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 8192) { await reader.cancel(); throw new Error("Form data is too large."); }
    chunks.push(value);
  }
  const data: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Invalid form data.");
  return data as Record<string, unknown>;
}
export const privateJson = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
