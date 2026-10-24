import { DatabaseSync } from "node:sqlite";
import { createHash, randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { parsePreferences } from "../preferences.ts";
import type { Preferences } from "../contracts.ts";
import { DIMENSIONS } from "../contracts.ts";
import { parseAttributeRatings } from "../visitor-ratings.ts";
import type { AttributeRatings, PlaceVisitorRatings } from "../visitor-ratings.ts";

const derive = promisify(scrypt);
const digest = (value: string) => createHash("sha256").update(value).digest("hex");
export type Account = { id: string; username: string; displayName: string };
export type VisitorReview = { id: string; userId: string; spaceSlug: string; displayName: string; rating: number; body: string; createdAt: string; attributes: AttributeRatings };

export class CommunityStore {
  private db: DatabaseSync;
  constructor(path: string) {
    this.db = new DatabaseSync(path);
    this.db.exec(`PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS accounts(id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, displayName TEXT NOT NULL, password TEXT NOT NULL, preferences TEXT);
      CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, userId TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE, expires INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS reviews(id TEXT PRIMARY KEY, userId TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE, spaceSlug TEXT NOT NULL, rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5), body TEXT NOT NULL, createdAt TEXT NOT NULL, UNIQUE(userId, spaceSlug));
      CREATE TABLE IF NOT EXISTS attempts(key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL);`);
    const columns = new Set(this.db.prepare("PRAGMA table_info(reviews)").all().map(row => String(row.name)));
    for (const dimension of DIMENSIONS) if (!columns.has(dimension)) {
      this.db.exec(`ALTER TABLE reviews ADD COLUMN ${dimension} INTEGER CHECK(${dimension} BETWEEN 1 AND 5)`);
    }
  }
  close() { this.db.close(); }
  allowAttempt(key: string, limit: number, window: number): boolean {
    const now = Date.now();
    this.db.prepare("DELETE FROM attempts WHERE expires < ?").run(now);
    const row = this.db.prepare(`INSERT INTO attempts(key,count,expires) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count`).get(key, now + window);
    return Number(row!.count) <= limit;
  }
  async register(username: string, displayName: string, password: string): Promise<Account> {
    username = username.trim().toLowerCase(); displayName = displayName.trim();
    if (!/^[a-z0-9_]{3,30}$/.test(username)) throw new Error("Use 3–30 letters, numbers or underscores for your username.");
    if (displayName.length < 2 || displayName.length > 50 || /[\x00-\x1f]/.test(displayName)) throw new Error("Choose a display name of 2–50 characters.");
    if (password.length < 12 || password.length > 128) throw new Error("Use a password of 12–128 characters.");
    const salt = randomBytes(16).toString("hex");
    const hash = await derive(password, salt, 64) as Buffer;
    const account = { id: randomUUID(), username, displayName };
    try { this.db.prepare("INSERT INTO accounts(id,username,displayName,password) VALUES(?,?,?,?)").run(account.id, username, displayName, `${salt}:${hash.toString("hex")}`); }
    catch { throw new Error("That username is unavailable. Try another one."); }
    return account;
  }
  async authenticate(username: string, password: string): Promise<Account | null> {
    if (password.length > 128) return null;
    const row = this.db.prepare("SELECT * FROM accounts WHERE username=?").get(username.trim().toLowerCase());
    const [salt, stored] = String(row?.password ?? "00000000000000000000000000000000:" + "0".repeat(128)).split(":");
    const hash = await derive(password, salt, 64) as Buffer;
    return timingSafeEqual(hash, Buffer.from(stored, "hex")) && row
      ? { id: String(row.id), username: String(row.username), displayName: String(row.displayName) } : null;
  }
  createSession(userId: string): string {
    this.db.prepare("DELETE FROM sessions WHERE expires < ?").run(Date.now());
    const token = randomBytes(32).toString("hex");
    this.db.prepare("INSERT INTO sessions(token,userId,expires) VALUES(?,?,?)").run(digest(token), userId, Date.now() + 30 * 86_400_000);
    return token;
  }
  session(token: string): Account | null {
    const row = this.db.prepare("SELECT a.id,a.username,a.displayName FROM accounts a JOIN sessions s ON s.userId=a.id WHERE s.token=? AND s.expires>?").get(digest(token), Date.now());
    return row ? { id: String(row.id), username: String(row.username), displayName: String(row.displayName) } : null;
  }
  revokeSession(token: string) { this.db.prepare("DELETE FROM sessions WHERE token=?").run(digest(token)); }
  preferences(userId: string): Preferences | null {
    const row = this.db.prepare("SELECT preferences FROM accounts WHERE id=?").get(userId);
    return row?.preferences ? parsePreferences(JSON.parse(String(row.preferences))) : null;
  }
  savePreferences(userId: string, preferences: Preferences) {
    const parsed = parsePreferences(preferences);
    if (!parsed) throw new Error("Invalid preferences.");
    this.db.prepare("UPDATE accounts SET preferences=? WHERE id=?").run(JSON.stringify(parsed), userId);
  }
  reviews(spaceSlug?: string, userId?: string): VisitorReview[] {
    const clauses: string[] = [], values: string[] = [];
    if (spaceSlug) { clauses.push("r.spaceSlug=?"); values.push(spaceSlug); }
    if (userId) { clauses.push("r.userId=?"); values.push(userId); }
    const rows = this.db.prepare(`SELECT r.*,a.displayName FROM reviews r JOIN accounts a ON a.id=r.userId ${clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""} ORDER BY r.createdAt DESC LIMIT 100`).all(...values);
    return rows.map(r => ({ id: String(r.id), userId: String(r.userId), spaceSlug: String(r.spaceSlug), displayName: String(r.displayName), rating: Number(r.rating), body: String(r.body), createdAt: String(r.createdAt), attributes: parseAttributeRatings(Object.fromEntries(DIMENSIONS.map(d => [d, r[d]]))) }));
  }
  ratingSummaries(now = new Date()): Record<string, PlaceVisitorRatings> {
    const aggregates = DIMENSIONS.map(d => `AVG(${d}) AS ${d}_average,COUNT(${d}) AS ${d}_count`).join(",");
    // Aggregate all recent reviews; display pagination must not skew the averages.
    const rows = this.db.prepare(`SELECT spaceSlug,AVG(rating) AS overall_average,COUNT(*) AS overall_count,${aggregates} FROM reviews WHERE createdAt>=? AND createdAt<=? GROUP BY spaceSlug`).all(new Date(now.getTime() - 60 * 86_400_000).toISOString(), now.toISOString());
    return Object.fromEntries(rows.map(row => [String(row.spaceSlug), {
      overall: { average: Number(row.overall_average), count: Number(row.overall_count) },
      attributes: Object.fromEntries(DIMENSIONS.map(d => [d, { average: row[`${d}_average`] === null ? null : Number(row[`${d}_average`]), count: Number(row[`${d}_count`]) }])) as PlaceVisitorRatings["attributes"],
    }]));
  }
  addReview(userId: string, spaceSlug: string, rating: number, body: string, attributeInput?: unknown): VisitorReview {
    const attributes = parseAttributeRatings(attributeInput);
    body = body.trim();
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || body.length < 20 || body.length > 1500) throw new Error("Choose 1–5 stars and write 20–1,500 characters.");
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(spaceSlug) || spaceSlug.length > 120) throw new Error("Choose a valid place.");
    if (!this.allowAttempt(`review:${userId}`, 10, 86_400_000)) throw new Error("Review limit reached. Please try again tomorrow.");
    const id = randomUUID(), createdAt = new Date().toISOString();
    try { this.db.prepare("INSERT INTO reviews(id,userId,spaceSlug,rating,body,createdAt,noise,crowds,brightness,scent) VALUES(?,?,?,?,?,?,?,?,?,?)").run(id, userId, spaceSlug, rating, body, createdAt, attributes.noise, attributes.crowds, attributes.brightness, attributes.scent); }
    catch { throw new Error("You already reviewed this place. Delete your previous review to replace it."); }
    return this.reviews(spaceSlug).find(r => r.id === id)!;
  }
  deleteReview(userId: string, id: string): boolean { return this.db.prepare("DELETE FROM reviews WHERE id=? AND userId=?").run(id, userId).changes > 0; }
}
