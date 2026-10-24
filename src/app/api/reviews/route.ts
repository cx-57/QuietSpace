import { communityStore, currentAccount, privateJson, readAccountBody } from "../../../lib/server/accounts";
import { loadDirectory } from "../../../lib/server/directory";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const body = await readAccountBody(request), user = await currentAccount();
    if (!user) return privateJson({ error: "Sign in before leaving a review." }, 401);
    if (typeof body.spaceSlug !== "string" || typeof body.rating !== "number" || typeof body.body !== "string") return privateJson({ error: "Choose a place, rating and review." }, 400);
    const directory = await loadDirectory(new Date(), body.spaceSlug);
    if (!directory.ok || !directory.value.spaces.length) return privateJson({ error: "This place is unavailable." }, 404);
    const review = communityStore().addReview(user.id, body.spaceSlug, body.rating, body.body, body.attributes);
    return privateJson({ review }, 201);
  } catch (error) { return privateJson({ error: error instanceof Error ? error.message : "Review could not be saved." }, 400); }
}
export async function DELETE(request: Request) {
  try {
    const body = await readAccountBody(request), user = await currentAccount();
    if (!user) return privateJson({ error: "Sign in first." }, 401);
    if (typeof body.id !== "string" || !communityStore().deleteReview(user.id, body.id)) return privateJson({ error: "Review not found." }, 404);
    return privateJson({ ok: true });
  } catch { return privateJson({ error: "Review could not be deleted." }, 400); }
}
