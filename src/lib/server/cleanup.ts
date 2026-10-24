import "server-only";
import { withDatabaseRole } from "./postgres";
const state=globalThis as typeof globalThis & { quietspaceCleanup?: ReturnType<typeof setInterval> };
export async function startAbuseCleanup() {
  if(state.quietspaceCleanup)return;
  async function purge(){
    try {await withDatabaseRole("service_role",async client=>{await client.query("SELECT public.purge_report_abuse_events()");});}
    catch {console.warn("QuietSpace: abuse cleanup could not reach the database. Check the operator health monitor.");}
  }
  await purge();
  state.quietspaceCleanup=setInterval(()=>{void purge();},3600000);
  state.quietspaceCleanup.unref();
}
