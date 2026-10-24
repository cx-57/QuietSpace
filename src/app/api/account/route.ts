import { cookies } from "next/headers";
import { communityStore, currentAccount, privateJson, readAccountBody, SESSION_COOKIE } from "../../../lib/server/accounts";
import { parsePreferences } from "../../../lib/preferences";

export const runtime = "nodejs";
export async function GET() {
  const user = await currentAccount();
  return privateJson({ user, preferences: user ? communityStore().preferences(user.id) : null });
}
export async function POST(request: Request) {
  try {
    const body = await readAccountBody(request);
    const store = communityStore();
    if (body.action === "logout") {
      const jar = await cookies();
      const token = jar.get(SESSION_COOKIE)?.value;
      if (token) store.revokeSession(token);
      jar.delete(SESSION_COOKIE);
      return privateJson({ ok: true });
    }
    const username = typeof body.username === "string" ? body.username : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!["register", "login"].includes(String(body.action))) return privateJson({ error: "Unknown account action." }, 400);
    if (!store.allowAttempt(`auth:${username.trim().toLowerCase().slice(0, 30)}`, 10, 900_000) ||
        !store.allowAttempt("auth:server", 100, 900_000)) return privateJson({ error: "Too many attempts. Try again in 15 minutes." }, 429);
    const user = body.action === "register"
      ? await store.register(username, typeof body.displayName === "string" ? body.displayName : "", password)
      : await store.authenticate(username, password);
    if (!user) return privateJson({ error: "Username or password is incorrect." }, 401);
    const jar = await cookies();
    const previous = jar.get(SESSION_COOKIE)?.value;
    if (previous) store.revokeSession(previous);
    jar.set(SESSION_COOKIE, store.createSession(user.id), { httpOnly: true, sameSite: "lax", secure: new URL(request.url).protocol === "https:", path: "/", maxAge: 30 * 86_400 });
    return privateJson({ user, preferences: store.preferences(user.id) });
  } catch (error) { return privateJson({ error: error instanceof Error ? error.message : "Account request failed." }, 400); }
}
export async function PUT(request: Request) {
  try {
    const body = await readAccountBody(request), user = await currentAccount();
    if (!user) return privateJson({ error: "Sign in to save preferences to your account." }, 401);
    const preferences = parsePreferences(body.preferences);
    if (!preferences) return privateJson({ error: "Invalid preferences." }, 400);
    communityStore().savePreferences(user.id, preferences);
    return privateJson({ ok: true });
  } catch { return privateJson({ error: "Preferences could not be saved." }, 400); }
}
