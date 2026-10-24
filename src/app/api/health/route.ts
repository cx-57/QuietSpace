import { loadDirectory } from "../../../lib/server/directory";
export const dynamic = "force-dynamic";
export async function GET() {
  const directory = await loadDirectory();
  return Response.json({ status: directory.ok ? "ok" : "unavailable" }, { status: directory.ok ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
