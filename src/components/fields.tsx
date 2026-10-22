import type { Dimension, Intensity } from "../lib/contracts";
import { DIMENSION_LABELS } from "../lib/preferences";

export function IntensityField({ dimension, value, onChange, observation = false, error }: {
  dimension: Dimension; value: Intensity | null; onChange: (value: Intensity | null) => void; observation?: boolean; error?: string;
}) {
  const hint = observation ? "1 = low intensity · 5 = high intensity"
    : dimension === "brightness" ? "Your preferred level: 1 = dim · 5 = bright"
    : "Your maximum comfortable level: 1 = low · 5 = high";
  return <div className="field">
    <label htmlFor={dimension}>{DIMENSION_LABELS[dimension]}</label>
    <p className="field-hint" id={`${dimension}-hint`}>{hint}</p>
    <select id={dimension} name={dimension} value={value ?? ""} aria-describedby={`${dimension}-hint${error ? ` ${dimension}-error` : ""}`}
      aria-invalid={error ? true : undefined} onChange={e => onChange(e.target.value === "" ? null : Number(e.target.value) as Intensity)}>
      <option value="">{observation ? "Not observed" : "No preference"}</option>
      {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}{n === 1 ? " — low" : n === 5 ? " — high" : ""}</option>)}
    </select>
    {error && <p className="field-error" id={`${dimension}-error`}>{error}</p>}
  </div>;
}
