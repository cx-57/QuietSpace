// Actual browser recording with editorial captions. Synthetic report scenes use a separate test database.
import { chromium } from "@playwright/test";
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, copyFileSync, writeFileSync } from "node:fs";
import { Client } from "pg";
const ownerUrl="postgresql://quietspace_owner@127.0.0.1:55432/quietspace_browser_test";
const id="10000000-0000-4000-8000-000000000001";
const db=new Client(ownerUrl);await db.connect();
await db.query("DELETE FROM public.sensory_reports WHERE space_id=$1",[id]);await db.query("DELETE FROM public.report_abuse_events");
for(const days of [1,2])await db.query("INSERT INTO public.sensory_reports(space_id,noise,crowds,brightness,observed_at,status,moderated_at) VALUES($1,2,2,3,now()-($2::text||' days')::interval,'approved',now())",[id,days]);
const children=[];
function start(args,env){const child=spawn(process.execPath,args,{env:{...process.env,...env},stdio:"ignore",windowsHide:true});children.push(child);return child;}
async function ready(url,child){for(let i=0;i<100;i++){if(child.exitCode!==null)throw new Error("Demo server failed to start.");try{if((await fetch(url)).ok)return;}catch{}await new Promise(r=>setTimeout(r,500));}throw new Error("Demo server timed out.");}
const curated=start(["tools/start.mjs","--port","3200"],{QUIETSPACE_DATA_MODE:"curated",REPORTS_ENABLED:"false"});
const connected=start(["node_modules/next/dist/bin/next","dev","--port","3201","--hostname","127.0.0.1"],{QUIETSPACE_DATA_MODE:"postgres",DATABASE_URL:"postgresql://quietspace_app@127.0.0.1:55432/quietspace_browser_test",APP_ORIGIN:"http://127.0.0.1:3201",REPORTS_ENABLED:"true",REPORT_TRUSTED_IP_HEADER:"",REPORT_ABUSE_SECRET:"SAMPLE test secret only with at least 32 characters",QUIETSPACE_TEST_OUTPUT:".next-postgres-test",NEXT_TELEMETRY_DISABLED:"1"});
let browser;
try{
  await Promise.all([ready("http://127.0.0.1:3200",curated),ready("http://127.0.0.1:3201",connected)]);
  mkdirSync("artifacts/demo",{recursive:true});
  browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL??"msedge",headless:true});
  const context=await browser.newContext({viewport:{width:1440,height:960},recordVideo:{dir:"artifacts/demo",size:{width:1440,height:960}}});
  const page=await context.newPage();
  await page.addInitScript(()=>{window.__quietspacePerf={lcp:0,cls:0};new PerformanceObserver(list=>{for(const entry of list.getEntries())window.__quietspacePerf.lcp=entry.startTime;}).observe({type:'largest-contentful-paint',buffered:true});new PerformanceObserver(list=>{for(const entry of list.getEntries())if(!entry.hadRecentInput)window.__quietspacePerf.cls+=entry.value;}).observe({type:'layout-shift',buffered:true});});
  async function caption(kicker,body){await page.evaluate(({kicker,body})=>{let box=document.querySelector('#demo-caption');if(!box){box=document.createElement('div');box.id='demo-caption';box.style.cssText='position:fixed;z-index:2147483647;bottom:0;left:0;right:0;background:#292e28;color:#fffefa;padding:18px 55px;font:19px/1.5 Arial,sans-serif;border-top:3px solid #be765d;';document.body.append(box);}box.replaceChildren();const a=document.createElement('div');a.style.cssText='font-size:11px;letter-spacing:2px;color:#e3b99e;margin-bottom:6px';a.textContent=kicker;const b=document.createElement('div');b.textContent=body;box.append(a,b);},{kicker,body});console.log(kicker);}
  const hold=ms=>page.waitForTimeout(ms);
  await page.goto("http://127.0.0.1:3200");await page.evaluate(()=>document.fonts.ready);
  await caption("QUIETSPACE / NEIGHBORHOOD HACKS", "Finding a suitable public place can take more research than the visit itself. QuietSpace starts with your needs.");await hold(15000);
  const performance=await page.evaluate(()=>({browser:navigator.userAgent,...window.__quietspacePerf,navigation:performance.getEntriesByType('navigation')[0].toJSON(),resourceBytes:performance.getEntriesByType('resource').reduce((sum,entry)=>sum+entry.transferSize,0),viewport:{width:innerWidth,height:innerHeight}}));
  writeFileSync('artifacts/performance.json',JSON.stringify(performance,null,2));
  await page.getByRole("link",{name:"Make it personal"}).click();await page.getByLabel("Noise",{exact:true}).selectOption("2");await page.getByLabel("Brightness",{exact:true}).selectOption("3");
  await caption("01 / YOUR PREFERENCES", "Choose noise, crowds, brightness and scent. No account, diagnosis or device location is required. Preferences stay in this browser.");await page.getByLabel("Noise",{exact:true}).scrollIntoViewIfNeeded();await hold(15000);
  await page.getByRole("link",{name:"Explore with these preferences"}).click();await page.locator('#places').scrollIntoViewIfNeeded();
  await caption("02 / A REAL NEIGHBORHOOD GUIDE", "Five source-reviewed Boston library locations. Unknown observations remain unknown; no quietness scores have been invented.");await hold(15000);
  await page.getByRole("checkbox",{name:"Step-free access"}).check();await page.getByText("No places meet these filters").scrollIntoViewIfNeeded();
  await caption("03 / UNKNOWN DOES NOT MEAN YES", "A required facility must be explicitly verified. An accessible entrance does not establish a step-free route throughout the building.");await hold(10000);
  await page.getByRole("checkbox",{name:"Step-free access"}).uncheck();await page.getByRole("link",{name:"Central Library in Copley Square",exact:true}).click();await page.getByRole("heading",{name:"Sensory observations",exact:true}).scrollIntoViewIfNeeded();
  await caption("04 / EVIDENCE YOU CAN INSPECT", "Source dates, facilities and past observations are separate facts. Historical patterns need at least three visits in the same time period.");await hold(20000);
  await page.goto("http://127.0.0.1:3201/preferences");await page.getByLabel("Noise",{exact:true}).selectOption("2");await page.getByLabel("Crowds",{exact:true}).selectOption("3");await page.getByLabel("Brightness",{exact:true}).selectOption("3");
  await page.goto("http://127.0.0.1:3201/spaces/sample-test-library/report");
  const local=await page.evaluate(()=>{const d=new Date(Date.now()-3600000);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);});await page.getByLabel("When did you visit?").fill(local);for(const [name,value]of [["Noise","2"],["Crowds","2"],["Brightness","3"]])await page.getByLabel(name,{exact:true}).selectOption(value);
  await page.getByRole("button",{name:"Send for review"}).scrollIntoViewIfNeeded();await caption("05 / REPORTING DEMO — SYNTHETIC TEST DATA", "This sample venue and observation exist only in an isolated test database. Reports contain structured sensory intensities, never personal comments.");await hold(20000);
  await page.getByRole("button",{name:"Send for review"}).click();await page.getByRole("heading",{name:"Thank you. Your report is awaiting review."}).waitFor();
  await caption("06 / REAL POSTGRESQL, PENDING ONLY — TEST DATA", "The report is stored pending. Database policies keep it out of public observations. Only a trusted operator can approve it.");await hold(15000);
  const pending=await db.query("SELECT id FROM public.sensory_reports WHERE status='pending' AND space_id=$1",[id]);
  const result=spawnSync(process.execPath,["tools/moderate.mjs","approve",pending.rows[0].id],{stdio:"ignore",windowsHide:true,env:{...process.env,LOCAL_OPERATOR_DATABASE_URL:ownerUrl}});if(result.status!==0)throw new Error("Demo moderation failed.");
  await page.getByRole("link",{name:"Return to venue",exact:true}).click();await page.getByText("100/100",{exact:false}).waitFor();
  await caption("07 / APPROVAL UPDATES EVIDENCE — TEST DATA", "Three approved sample observations now support a fit score. Fit is separate from reliability, and never promises live conditions.");await hold(15000);
  await page.goto("http://127.0.0.1:3200");await caption("QUIETSPACE / A LITTLE MORE ROOM TO BE YOURSELF", "A working, accessible neighborhood guide. Built with Next.js, TypeScript and PostgreSQL, with AI coding assistance disclosed.");await hold(15000);
  const video=page.video();await context.close();copyFileSync(await video.path(),"artifacts/quietspace-demo.webm");console.log("Demo recorded: artifacts/quietspace-demo.webm (silent, captioned actual browser footage).");
}finally{if(browser)await browser.close();await db.end();for(const child of children){if(process.platform==='win32')spawnSync('taskkill',['/pid',String(child.pid),'/t','/f'],{stdio:'ignore',windowsHide:true});else child.kill('SIGTERM');}}
