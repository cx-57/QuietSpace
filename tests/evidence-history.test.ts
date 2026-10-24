import assert from "node:assert/strict";
import test from "node:test";
import type { ApprovedReport } from "../src/lib/contracts.ts";
import { evidenceSummary } from "../src/lib/sensory-score.ts";
import { historicalPatterns } from "../src/lib/historical-patterns.ts";
const spaceId = "10000000-0000-4000-8000-000000000001";
const now = new Date("2026-11-15T18:00:00Z");
function report(id: number, observedAt: string): ApprovedReport {
  return { id: String(id), spaceId, observedAt, createdAt: now.toISOString(), intensities: { noise: 2, crowds: 3, brightness: null, scent: null }, status: "approved", isFixture: false };
}
test("evidence rules distinguish 0, 1-2, clusters and supported spread independently of preferences", () => {
  assert.equal(evidenceSummary([], spaceId, now, "America/New_York").label, "no_observations");
  for (const n of [1, 2]) assert.equal(evidenceSummary(Array.from({ length:n }, (_,i) => report(i,"2026-11-14T16:00:00Z")),spaceId,now,"America/New_York").label,"insufficient_observations");
  const clustered = Array.from({ length: 6 }, (_,i) => report(i,"2026-11-14T16:00:00Z"));
  assert.equal(evidenceSummary(clustered,spaceId,now,"America/New_York").label,"limited_observations");
  const spread = clustered.map((r,i) => ({ ...r, observedAt:`2026-11-${10 + i}T16:00:00Z` }));
  assert.equal(evidenceSummary(spread,spaceId,now,"America/New_York").label,"supported_observations");
  assert.equal(evidenceSummary(spread.map(r => ({...r,observedAt:r.observedAt.replace("11-","10-")})),spaceId,now,"America/New_York").label,"limited_observations");
  assert.equal(evidenceSummary(spread.map(r => ({...r,status:"pending"})) as unknown as ApprovedReport[],spaceId,now,"America/New_York").label,"no_observations");
});
test("historical bin threshold is 3, median is exact, unknowns are omitted and no observations fabricated", () => {
  const rows = [1,2,3].map(n => report(n,"2026-11-09T15:00:00Z")); // Monday morning in Boston
  rows[2].intensities.noise = 5;
  assert.equal(historicalPatterns(rows.slice(0,2),spaceId,"America/New_York",now).find(b => b.dayType === "weekday" && b.period === "morning")!.medianNoise,null);
  const bins = historicalPatterns(rows,spaceId,"America/New_York",now);
  assert.equal(bins.find(b => b.dayType === "weekday" && b.period === "morning")!.medianNoise,2);
  assert.equal(bins.filter(b => b.medianNoise !== null).length,1);
  assert.equal(bins.reduce((sum,b) => sum+b.count,0),3);
});
test("venue-local dates, weekends, DST and overnight use local clock rather than UTC", () => {
  const dates = ["2026-11-01T06:30:00Z","2026-11-01T07:30:00Z","2026-11-01T12:00:00Z","2026-11-01T13:00:00Z","2026-11-01T14:00:00Z"];
  const bins = historicalPatterns(dates.map((d,i)=>report(i,d)),spaceId,"America/New_York",now);
  const weekend = bins.find(b=>b.dayType === "weekend" && b.period === "morning")!;
  assert.equal(weekend.count,3); assert.equal(weekend.medianNoise,2); // 1:30 and 2:30 am excluded
  const pacific = historicalPatterns([1,2,3].map(n=>report(n,"2026-11-02T02:00:00Z")),spaceId,"America/Los_Angeles",now);
  assert.equal(pacific.find(b=>b.dayType === "weekend" && b.period === "evening")!.count,3);
});
test("stale, future, pending and fixture reports do not create historical patterns", () => {
  const bad = [report(1,"2026-01-01T12:00:00Z"),report(2,"2026-12-01T12:00:00Z"),{...report(3,"2026-11-10T12:00:00Z"),status:"pending"},{...report(4,"2026-11-10T12:00:00Z"),isFixture:true}] as ApprovedReport[];
  assert.equal(historicalPatterns(bad,spaceId,"America/New_York",now).reduce((sum,b)=>sum+b.count,0),0);
});
