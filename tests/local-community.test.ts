import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CommunityStore } from "../src/lib/server/community-store.ts";
import { DEFAULT_PREFERENCES } from "../src/lib/preferences.ts";

test("accounts persist hashed passwords, preferences and reviews with ownership checks", async () => {
  const folder = mkdtempSync(join(tmpdir(), "quietspace-account-"));
  let store = new CommunityStore(join(folder, "test.sqlite"));
  try {
    const user = await store.register("reader_one", "Reader One", "A strong test password 42!");
    assert.equal(await store.authenticate("reader_one", "wrong password"), null);
    assert.equal((await store.authenticate("READER_ONE", "A strong test password 42!"))?.id, user.id);
    await assert.rejects(store.register("reader_one", "Duplicate", "Another password 42!"));
    await assert.rejects(store.register("short", "Name", "123"));
    const token = store.createSession(user.id);
    assert.equal(store.session(token)?.id, user.id);
    assert.equal(store.session("not-a-real-session"), null);
    const preferences = { ...DEFAULT_PREFERENCES, requiredFeatures: ["quiet_room" as const] };
    store.savePreferences(user.id, preferences);
    assert.deepEqual(store.preferences(user.id), preferences);
    const review = store.addReview(user.id, "bpl-central", 4, "A pleasant place to read during my visit.");
    assert.equal(store.reviews("bpl-central")[0].body, review.body);
    assert.equal(store.reviews("bpl-central")[0].displayName, "Reader One");
    assert.equal(store.deleteReview("different-user", review.id), false);
    const other = await store.register("other_reader", "Other Reader", "A different strong password 42!");
    store.addReview(other.id, "bpl-brighton", 5, "A different reader's experience at a different place.");
    assert.deepEqual(store.reviews(undefined, user.id).map(r => r.id), [review.id]);
    store.close();
    store = new CommunityStore(join(folder, "test.sqlite"));
    assert.equal(store.reviews("bpl-central").length, 1);
    assert.deepEqual(store.preferences(user.id), preferences);
    assert.equal(store.deleteReview(user.id, review.id), true);
    store.revokeSession(token);
    assert.equal(store.session(token), null);
  } finally { store.close(); rmSync(folder, { recursive: true, force: true }); }
});

test("review validation and rate limits reject invalid or repeated contributions", async () => {
  const store = new CommunityStore(":memory:");
  try {
    const user = await store.register("visitor", "Visitor", "Another strong password 42!");
    assert.throws(() => store.addReview(user.id, "bpl-central", 6, "This is a sufficiently long review."));
    assert.throws(() => store.addReview(user.id, "bpl-central", 3, "tiny"));
    store.addReview(user.id, "bpl-central", 3, "This is a sufficiently long review.");
    assert.throws(() => store.addReview(user.id, "bpl-central", 3, "This is another sufficiently long review."));
    for (let i = 0; i < 10; i++) assert.equal(store.allowAttempt("login:visitor", 10, 900_000), true);
    assert.equal(store.allowAttempt("login:visitor", 10, 900_000), false);
  } finally { store.close(); }
});
