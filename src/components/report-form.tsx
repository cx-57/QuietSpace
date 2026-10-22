"use client";
import Link from "next/link";
import { useRef, useState, useSyncExternalStore } from "react";
import type { FormEvent } from "react";
import { DIMENSIONS } from "../lib/contracts";
import type { AppError, Intensities } from "../lib/contracts";
import { parseReportInput } from "../lib/validation";
import { IntensityField } from "./fields";

const subscribeHydration = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

export function ReportForm({ spaceId, slug }: { spaceId: string; slug: string }) {
  const ready = useSyncExternalStore(subscribeHydration, clientReady, serverReady);
  const [intensities, setIntensities] = useState<Intensities>({ noise: null, crowds: null, brightness: null, scent: null });
  const [observedAt, setObservedAt] = useState("");
  const [error, setError] = useState<AppError | null>(null);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLElement>(null);
  const inFlight = useRef(false);
  function showError(value: AppError) {
    setError(value);
    requestAnimationFrame(() => errorRef.current?.focus());
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (inFlight.current) return;
    const stamp = new Date(observedAt);
    if (!observedAt) { showError({ code: "invalid_input", message: "Check your observation.", fields: { observedAt: "Choose a visit date and time." } }); return; }
    const payload = { spaceId, observedAt: Number.isFinite(stamp.getTime()) ? stamp.toISOString() : "", intensities };
    const parsed = parseReportInput(payload);
    if (!parsed.ok) { showError(parsed.error); return; }
    inFlight.current = true; setBusy(true); setError(null);
    try {
      const response = await fetch("/api/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.value), signal: AbortSignal.timeout(15000) });
      const result = await response.json();
      if (!response.ok || result?.ok !== true || result?.value?.status !== "pending") {
        const fields: Record<string, string> = {};
        if (result?.error?.fields && typeof result.error.fields === "object") {
          for (const [key, value] of Object.entries(result.error.fields)) if (typeof value === "string") fields[key] = value;
        }
        showError({ code: response.status === 429 ? "rate_limited" : "invalid_input", message: typeof result?.error?.message === "string" ? result.error.message : "We could not confirm submission. Try again later.", fields });
      } else { setSuccess(true); requestAnimationFrame(() => successRef.current?.focus()); }
    } catch { showError({ code: "unavailable", message: "We could not confirm submission. Your inputs are still here. Please try again later; repeated observations are limited." }); }
    finally { setBusy(false); inFlight.current = false; }
  }
  if (success) return <section ref={successRef} tabIndex={-1} className="notice" aria-labelledby="receipt-heading"><h2 id="receipt-heading">Thank you. Your report is awaiting review.</h2><p role="status">It is pending and is not public yet. A moderator must approve it before it appears in observations or matching.</p><Link className="back-link" href={`/spaces/${slug}`}>Return to venue</Link></section>;
  return <form className="panel report-form" method="post" action="/api/reports" onSubmit={submit} noValidate aria-busy={busy}>
    <noscript><p className="notice">JavaScript is required to submit this structured report. You can still read the venue’s sources.</p></noscript>
    {error && <div ref={errorRef} tabIndex={-1} className="error-summary" role="alert" aria-labelledby="report-error-heading"><h2 id="report-error-heading">Check your observation</h2><p>{error.message}</p>
      {error.fields && <ul>{Object.entries(error.fields).map(([field, message]) => <li key={field}>{["observedAt", ...DIMENSIONS].includes(field) ? <a href={`#${field}`}>{message}</a> : message}</li>)}</ul>}</div>}
    <div className="field"><label htmlFor="observedAt">When did you visit?</label><p id="time-hint" className="field-hint">Use a visit in the last 60 days. Enter the time in your device’s local time zone; it will be converted to an absolute timestamp. Do not enter a future visit.</p>
      <input id="observedAt" name="observedAt" type="datetime-local" required value={observedAt} onChange={e => setObservedAt(e.target.value)} aria-invalid={error?.fields?.observedAt ? true : undefined} aria-describedby={`time-hint${error?.fields?.observedAt ? " time-error" : ""}`} />
      {error?.fields?.observedAt && <p className="field-error" id="time-error">{error.fields.observedAt}</p>}</div>
    <fieldset><legend>What did you notice?</legend><p id="intensity-hint">Choose at least one intensity. Leave anything you did not notice as “Not observed.” These describe the place during your visit, rather than your comfort level.</p>
      <div className="field-grid">{DIMENSIONS.map(d => <IntensityField key={d} dimension={d} observation value={intensities[d]} onChange={value => setIntensities({ ...intensities, [d]: value })} error={error?.fields?.[d]} />)}</div>
      {error?.fields?.intensities && <p className="field-error">{error.fields.intensities}</p>}</fieldset>
    <p className="small muted">No names, diagnosis, comments or device location are requested. Approved observations become public after moderation. To limit spam, a network pseudonym rotates daily. Abuse records expire after 24 hours and are removed by scheduled cleanup. They are not published.</p>
    <button type="submit" disabled={busy || !ready}>{busy ? "Sending for review…" : "Send for review"}</button><p className="small">Your report will remain pending until reviewed.</p>
  </form>;
}
