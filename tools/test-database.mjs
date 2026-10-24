import pg from "pg";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
const ownerUrl=process.env.TEST_OPERATOR_DATABASE_URL??"postgresql://quietspace_owner@127.0.0.1:55432/postgres";
const parsed=new URL(ownerUrl);
if(parsed.hostname!=="127.0.0.1"||parsed.port!=="55432")throw new Error("This test runner only operates on the isolated loopback test cluster.");
const owner=new pg.Client(ownerUrl);await owner.connect();
const database=`quietspace_verify_${Date.now()}`;
const pgBin=process.env.PG_BIN??(process.platform==='win32'?'C:/Program Files/PostgreSQL/18/bin':'');
function run(file){const result=spawnSync(pgBin?join(pgBin,'psql'+(process.platform==='win32'?'.exe':'')):'psql',['-X','-h','127.0.0.1','-p','55432','-U','quietspace_owner','-d',database,'-v','ON_ERROR_STOP=1','-f',file],{stdio:'inherit',windowsHide:true});if(result.status!==0)throw new Error(`Database check failed: ${file}`);}
let created=false;
try{
  await owner.query(`CREATE DATABASE ${database}`);created=true;
  for(const file of ['supabase/tests/bootstrap_roles.sql','supabase/migrations/202610200001_foundation.sql','supabase/migrations/202610220001_report_abuse_controls.sql','supabase/migrations/202610230001_cleanup_capability.sql','supabase/tests/foundation.sql','supabase/tests/reports.sql','supabase/tests/cleanup.sql'])run(file);
  const seed=spawnSync(process.env.PYTHON??(process.platform==='win32'?'python':'python3'),['tools/import_venues.py','--output','artifacts/venues.sql'],{stdio:'inherit',windowsHide:true});if(seed.status!==0)throw new Error('Venue import validation failed');
  run('supabase/tests/import_replay.sql');
  console.log('PASS: all real PostgreSQL migration, RLS, report, limit, retention and import replay checks.');
}finally{
  if(created&&/^quietspace_verify_\d+$/.test(database))await owner.query(`DROP DATABASE ${database} WITH (FORCE)`);
  await owner.end();
}
