import nextEnv from "@next/env";
import { readFileSync } from "node:fs";
import pg from "pg";
nextEnv.loadEnvConfig(process.cwd());
const [command = "pending", id] = process.argv.slice(2);
if (!["pending", "approve", "reject", "purge"].includes(command)) throw new Error("Use pending, approve UUID, reject UUID, or purge.");
const connectionString = process.env.LOCAL_OPERATOR_DATABASE_URL;
if (!connectionString) throw new Error("Set LOCAL_OPERATOR_DATABASE_URL in your secured operator environment. Never use a browser credential.");
const db = new pg.Client({ connectionString });
await db.connect();
try {
  if (command === "pending") {
    const result = await db.query("SELECT r.id,s.name,r.observed_at,r.noise,r.crowds,r.brightness,r.scent FROM public.sensory_reports r JOIN public.spaces s ON s.id=r.space_id WHERE r.status='pending' AND NOT r.is_fixture ORDER BY r.created_at,r.id LIMIT 50");
    console.table(result.rows);
  } else if (command === "purge") {
    await db.query("SELECT public.purge_report_abuse_events()"); console.log("Expired abuse records purged.");
  } else {
    if (!/^[a-f0-9-]{36}$/i.test(id ?? "")) throw new Error("Provide one exact report UUID.");
    await db.query("BEGIN");
    await db.query("SELECT set_config('quietspace.report_id',$1,true),set_config('quietspace.decision',$2,true)", [id, command === "approve" ? "approved" : "rejected"]);
    // Reuse the vetted operator transaction body without psql interpolation commands.
    const sql = readFileSync(new URL("../supabase/operations/moderate_report.sql", import.meta.url), "utf8");
    const body = sql.slice(sql.indexOf("do $$"), sql.lastIndexOf("commit;"));
    const results = await db.query(body);
    await db.query("COMMIT");
    console.log(`Report ${id} ${command === "approve" ? "approved" : "rejected"}. Reload the venue to see the updated evidence.`);
    if (results.rows) console.table(results.rows);
  }
} catch (error) { await db.query("ROLLBACK"); throw error; }
finally { await db.end(); }
