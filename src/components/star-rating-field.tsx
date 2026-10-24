"use client";
import type { Intensity } from "../lib/contracts";

export function StarRatingField({ name, label, hint, value, onChange, required = false }: {
  name: string; label: string; hint: string; value: Intensity | null; onChange: (value: Intensity | null) => void; required?: boolean;
}) {
  return <fieldset className="star-rating-field" aria-describedby={`${name}-hint`}>
    <legend>{label}{!required && <span className="small muted"> · optional</span>}</legend>
    <p id={`${name}-hint`} className="field-hint">{hint}</p>
    <div className="star-rating-options">{([1, 2, 3, 4, 5] as const).map(n => <label key={n} className="star-choice" data-filled={value !== null && n <= value}>
      <input type="radio" name={name} value={n} checked={value === n} required={required} onChange={() => onChange(n)} aria-label={`${n} ${n === 1 ? "star" : "stars"}`} />
      <span aria-hidden="true">★</span>
    </label>)}<span className="star-value" aria-live="polite">{value === null ? "Not rated" : `${value}/5`}</span></div>
    {!required && value !== null && <button type="button" className="text-button clear-star-rating" onClick={() => onChange(null)}>Clear {label.toLowerCase()} rating</button>}
  </fieldset>;
}
