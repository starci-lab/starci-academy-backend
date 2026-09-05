import { createHash, randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { AnalyzeRequest, FillProposal, Profile } from "../domain/contracts.js";

export interface HistoryItem {
  id: string;
  createdAt: string;
  origin: string;
  path: string;
  title: string;
  mode: "assist" | "synthetic";
  model: string;
  proposalCount: number;
  cached: boolean;
}

export class LocalStore {
  readonly #database: DatabaseSync;

  constructor(databasePath = resolve(".data", "form-copilot.sqlite")) {
    mkdirSync(dirname(databasePath), { recursive: true });
    this.#database = new DatabaseSync(databasePath);
    this.#database.exec(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS cache (
        cache_key TEXT PRIMARY KEY,
        model TEXT NOT NULL,
        proposals_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS runs (
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        origin TEXT NOT NULL,
        path TEXT NOT NULL,
        title TEXT NOT NULL,
        mode TEXT NOT NULL,
        model TEXT NOT NULL,
        proposal_count INTEGER NOT NULL,
        cached INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value_json TEXT NOT NULL
      );
    `);
  }

  cacheKey(request: AnalyzeRequest, model: string): string {
    return createHash("sha256").update(JSON.stringify({ request, model })).digest("hex");
  }

  getCached(cacheKey: string): FillProposal[] | null {
    const row = this.#database.prepare("SELECT proposals_json FROM cache WHERE cache_key = ?").get(cacheKey) as { proposals_json?: string } | undefined;
    return row?.proposals_json ? JSON.parse(row.proposals_json) as FillProposal[] : null;
  }

  setCached(cacheKey: string, model: string, proposals: FillProposal[]): void {
    this.#database.prepare(`
      INSERT INTO cache(cache_key, model, proposals_json, created_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(cache_key) DO UPDATE SET
        model = excluded.model,
        proposals_json = excluded.proposals_json,
        created_at = excluded.created_at
    `).run(cacheKey, model, JSON.stringify(proposals), new Date().toISOString());
  }

  saveRun(request: AnalyzeRequest, model: string, proposals: FillProposal[], cached: boolean): string {
    const id = randomUUID();
    const url = new URL(request.form.url);
    this.#database.prepare(`
      INSERT INTO runs(id, created_at, origin, path, title, mode, model, proposal_count, cached)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      new Date().toISOString(),
      url.origin,
      url.pathname,
      request.form.title,
      request.mode,
      model,
      proposals.length,
      cached ? 1 : 0,
    );
    return id;
  }

  listHistory(limit = 30): HistoryItem[] {
    const rows = this.#database.prepare(`
      SELECT id, created_at, origin, path, title, mode, model, proposal_count, cached
      FROM runs ORDER BY created_at DESC LIMIT ?
    `).all(Math.min(Math.max(limit, 1), 100)) as Array<Record<string, string | number>>;
    return rows.map((row) => ({
      id: String(row.id),
      createdAt: String(row.created_at),
      origin: String(row.origin),
      path: String(row.path),
      title: String(row.title),
      mode: String(row.mode) as HistoryItem["mode"],
      model: String(row.model),
      proposalCount: Number(row.proposal_count),
      cached: Boolean(row.cached),
    }));
  }

  getProfile(): Profile {
    const row = this.#database.prepare("SELECT value_json FROM settings WHERE key = 'profile'").get() as { value_json?: string } | undefined;
    return row?.value_json ? JSON.parse(row.value_json) as Profile : {};
  }

  setProfile(profile: Profile): void {
    this.#database.prepare(`
      INSERT INTO settings(key, value_json) VALUES ('profile', ?)
      ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json
    `).run(JSON.stringify(profile));
  }

  clearPrivateData(): void {
    this.#database.exec("DELETE FROM cache; DELETE FROM runs; DELETE FROM settings;");
  }
}
