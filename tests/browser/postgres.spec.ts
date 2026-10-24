import { test, expect } from "@playwright/test";
import { Client } from "pg";
import { spawnSync } from "node:child_process";
const ownerUrl = "postgresql://quietspace_owner@127.0.0.1:55432/quietspace_browser_test";
const venueId = "10000000-0000-4000-8000-000000000001";
test.beforeEach(async () => {
  const db = new Client(ownerUrl); await db.connect();
  await db.query("DELETE FROM public.sensory_reports WHERE space_id=$1", [venueId]);
  await db.query("DELETE FROM public.report_abuse_events");
  for (const days of [1,2]) await db.query("INSERT INTO public.sensory_reports(space_id,noise,crowds,brightness,observed_at,status,moderated_at) VALUES($1,2,2,3,now()-($2::text||' days')::interval,'approved',now())",[venueId,days]);
  await db.end();
});
test("real browser -> pending PostgreSQL -> operator approval -> shared evidence -> rejection", async ({ page, request }) => {
  const db = new Client(ownerUrl); await db.connect();
  try {
    await page.goto("/preferences");
    await page.getByLabel("Noise", { exact: true }).selectOption("2");
    await page.getByLabel("Crowds", { exact: true }).selectOption("3");
    await page.getByLabel("Brightness", { exact: true }).selectOption("3");
    await expect.poll(async () => page.evaluate(() => {
      const raw = localStorage.getItem("quietspace.preferences.v1");
      return raw ? JSON.parse(raw).maximumIntensities : null;
    })).toMatchObject({ noise: 2, crowds: 3, brightness: 3 });
    await page.goto("/spaces/sample-test-library/report");
    const local = await page.evaluate(()=>{const d=new Date(Date.now()-3600000); return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);});
    await page.getByLabel("When did you visit?").fill(local);
    for (const [name,value] of [["Noise","2"],["Crowds","2"],["Brightness","3"]]) await page.getByLabel(name,{exact:true}).selectOption(value);
    await page.getByRole("button",{name:"Send for review"}).click();
    await expect(page.getByRole("heading",{name:"Thank you. Your report is awaiting review."})).toBeVisible();
    const pending = await db.query("SELECT id,status FROM public.sensory_reports WHERE status='pending'");
    expect(pending.rowCount).toBe(1);
    await page.getByRole("link",{name:"Return to venue",exact:true}).click();
    await expect(page.getByText("2 approved observations in the last 60 days")).toBeVisible();
    const result=spawnSync(process.execPath,["tools/moderate.mjs","approve",pending.rows[0].id],{encoding:"utf8",windowsHide:true,env:{...process.env,LOCAL_OPERATOR_DATABASE_URL:ownerUrl}});
    expect(result.status,result.stderr).toBe(0);
    await page.reload();
    await expect(page.getByText("3 approved observations in the last 60 days")).toBeVisible();
    await expect(page.getByText("100/100",{exact:false})).toBeVisible();
    await page.getByRole("link",{name:"← All places"}).click();
    await expect(page.getByRole("article").getByText("100",{exact:false})).toBeVisible();
    await db.query("UPDATE public.sensory_reports SET status='rejected',moderated_at=clock_timestamp() WHERE id=$1",[pending.rows[0].id]);
    await page.goto("/spaces/sample-test-library");
    await expect(page.getByText("2 approved observations in the last 60 days")).toBeVisible();
    await expect(page.getByText("100/100",{exact:false})).toHaveCount(0);
    const invalid=await request.post("/api/reports",{headers:{origin:"http://127.0.0.1:3102"},data:{spaceId:venueId,status:"approved"}});
    expect(invalid.status()).toBe(400);
  } finally { await db.end(); }
});
test("real persistent limiter serializes concurrent requests and denies anonymous protected writes",async()=>{
  const clients=Array.from({length:8},()=>new Client(ownerUrl));
  try {
    await Promise.all(clients.map(c=>c.connect()));
    const results=await Promise.all(clients.map(async(c,i)=>{
      await c.query("BEGIN"); await c.query("SET LOCAL ROLE service_role");
      try {await c.query("SELECT public.submit_rate_limited_report($1,now(),2::smallint,NULL::smallint,NULL::smallint,NULL::smallint,$2,$3)",[venueId,"a".repeat(64),String(i).padStart(64,"0")]);await c.query("COMMIT");return "accepted";}
      catch(e){await c.query("ROLLBACK");return (e as {code:string}).code;}
    }));
    expect(results.filter(r=>r==="accepted")).toHaveLength(1);
    expect(results.filter(r=>r==="P0429")).toHaveLength(7);
    await clients[0].query("BEGIN");await clients[0].query("SET LOCAL ROLE anon");
    expect((await clients[0].query("SELECT * FROM public.sensory_reports")).rowCount).toBe(2);
    await expect(clients[0].query("UPDATE public.sensory_reports SET status='approved',moderated_at=now()")).rejects.toMatchObject({code:"42501"});
    await clients[0].query("ROLLBACK");
  } finally {await Promise.all(clients.map(c=>c.end()));}
});
