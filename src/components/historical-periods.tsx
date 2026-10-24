import type { PublicSpace } from "../lib/contracts";
import { historicalPatterns, PERIODS } from "../lib/historical-patterns";
import { Icon } from "./icon";
export function HistoricalPeriods({ space, now }: { space: PublicSpace; now: Date }) {
  const bins = historicalPatterns(space.reports, space.id, space.timeZone, now);
  const available = bins.some(b => b.medianNoise !== null);
  return <section className="panel history-panel" aria-labelledby="history-heading"><p className="eyebrow">PAST VISITS, NOT PREDICTIONS</p><h2 id="history-heading">A rhythm, over time.</h2>
    {available ? <><p>Median noise from approved visits in the last 60 days. Each period needs at least 3 observations. Lower values describe lower reported intensity.</p><table className="history-grid"><caption className="sr-only">Historical noise in {space.timeZone}</caption><thead><tr><th scope="col">Local day</th>{PERIODS.map(period => <th scope="col" key={period}>{period[0].toUpperCase() + period.slice(1)}</th>)}</tr></thead><tbody>{(["weekday", "weekend"] as const).map(day => <tr key={day}><th scope="row">{day === "weekday" ? "Weekday" : "Weekend"}</th>{PERIODS.map(period => {
      const bin = bins.find(b => b.dayType === day && b.period === period)!;
      return <td key={period}>{bin.medianNoise === null ? "Not enough data" : `${bin.medianNoise}/5`}<span>{bin.count} observation{bin.count === 1 ? "" : "s"}</span></td>;
    })}</tr>)}</tbody></table></> : <div className="history-empty"><Icon name="clock" size={28} /><p>It’s a little early for a pattern.<span>Once there are 3 recent observations in the same period, you’ll see a historical picture here. Until then, we’ll leave it unknown.</span></p></div>}
    <p className="small muted">Venue time: {space.timeZone}. Morning 6am–noon · Afternoon noon–6pm · Evening 6pm–midnight. Overnight visits are not included. Conditions may change.</p>
  </section>;
}
