"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePreferences } from "./preferences-provider";
import { parsePreferences } from "../lib/preferences";

export function AccountForm({ returnTo = "/preferences" }: { returnTo?: string }) {
  const router = useRouter();
  const [register, setRegister] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { update } = usePreferences();
  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/account", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: register ? "register" : "login", username: data.get("username"), password: data.get("password"), displayName: data.get("displayName") }) });
      const result = await response.json();
      if (!response.ok) { setError(result.error ?? "Could not sign in."); return; }
      const saved = parsePreferences(result.preferences);
      if (saved) update(saved);
      router.push(returnTo.startsWith("/") && !returnTo.startsWith("//") && !returnTo.includes("\\") ? returnTo : "/preferences");
      router.refresh();
    } catch { setError("Could not reach the server. Please try again."); }
    finally { setBusy(false); }
  }
  return <section className="panel account-panel">
    <div className="actions"><button className={register ? "secondary" : ""} type="button" aria-pressed={!register} onClick={() => { setRegister(false); setError(""); }}>Sign in</button><button className={register ? "" : "secondary"} type="button" aria-pressed={register} onClick={() => { setRegister(true); setError(""); }}>Create account</button></div>
    <h2>{register ? "Make yourself at home." : "Welcome back."}</h2>
    <form onSubmit={submit} className="account-form" aria-busy={busy}>
      {error && <p role="alert" className="notice">{error}</p>}
      <div className="field"><label htmlFor="username">Username</label><input id="username" name="username" required minLength={3} maxLength={30} pattern="[A-Za-z0-9_]+" autoComplete="username" /><p className="field-hint">3–30 letters, numbers or underscores.</p></div>
      {register && <div className="field"><label htmlFor="displayName">Public display name</label><input id="displayName" name="displayName" required minLength={2} maxLength={50} autoComplete="nickname" /><p className="field-hint">Shown with your reviews. A nickname is fine.</p></div>}
      <div className="field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" required minLength={register ? 12 : 1} maxLength={128} autoComplete={register ? "new-password" : "current-password"} />{register && <p className="field-hint">At least 12 characters. Keep it somewhere safe; email recovery is not available yet.</p>}</div>
      <button disabled={busy} type="submit">{busy ? "Please wait…" : register ? "Create account & continue" : "Sign in & continue"}</button>
    </form>
    <p className="small muted">Your account and reviews are stored on this QuietSpace server. No email address is required. Browsing never requires an account.</p>
  </section>;
}
export function SignOutButton() {
  const router = useRouter();
  const [error, setError] = useState("");
  return <><button className="secondary" onClick={async () => {
    try {
      const response = await fetch("/api/account", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "logout" }) });
      if (!response.ok) throw new Error();
      router.push("/"); router.refresh();
    } catch { setError("Could not sign out. Please try again."); }
  }}>Sign out</button>{error && <p role="alert">{error}</p>}</>;
}
