import { Injectable, OnApplicationShutdown, OnModuleInit } from "@nestjs/common";
import type { AnalyzeRequest, FillProposal, FormSnapshot, Profile } from "@form-copilot/contracts";
import { createHash, randomUUID } from "node:crypto";
import { Pool, type PoolClient } from "pg";
import { appConfig } from "../config.js";

export interface ConversationTurn { role: "user" | "assistant"; content: unknown }

@Injectable()
export class DatabaseService implements OnModuleInit, OnApplicationShutdown {
  readonly #pool = new Pool({ connectionString: appConfig.databaseUrl, max: 8, idleTimeoutMillis: 30_000 });

  async onModuleInit(): Promise<void> {
    await this.#pool.query(`
      CREATE TABLE IF NOT EXISTS form_snapshots (
        id UUID PRIMARY KEY, fingerprint TEXT NOT NULL UNIQUE, origin TEXT NOT NULL, path TEXT NOT NULL,
        title TEXT NOT NULL, schema_json JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY, form_snapshot_id UUID NOT NULL REFERENCES form_snapshots(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS conversation_messages (
        id BIGSERIAL PRIMARY KEY, conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        role TEXT NOT NULL CHECK (role IN ('user', 'assistant')), content JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS conversation_messages_recent_idx ON conversation_messages(conversation_id, id DESC);
      CREATE TABLE IF NOT EXISTS proposal_cache (
        cache_key TEXT PRIMARY KEY, model TEXT NOT NULL, proposals JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS runs (
        id UUID PRIMARY KEY, conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        mode TEXT NOT NULL CHECK (mode IN ('assist', 'synthetic')), model TEXT NOT NULL,
        proposal_count INTEGER NOT NULL, cached BOOLEAN NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS synthetic_batches (
        id UUID PRIMARY KEY, form_snapshot_id UUID NOT NULL REFERENCES form_snapshots(id) ON DELETE CASCADE,
        model TEXT NOT NULL, request_json JSONB NOT NULL, plan_summary TEXT NOT NULL,
        planned_count INTEGER NOT NULL CHECK (planned_count BETWEEN 1 AND 400), rows_json JSONB NOT NULL,
        submitted BOOLEAN NOT NULL DEFAULT false CHECK (submitted = false),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY, value_json JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
  }

  fingerprint(value: unknown): string { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }

  async upsertFormSnapshot(form: FormSnapshot): Promise<string> {
    const url = new URL(form.url);
    const fingerprint = this.fingerprint({ origin: url.origin, path: url.pathname, fields: form.fields });
    const result = await this.#pool.query<{ id: string }>(`
      INSERT INTO form_snapshots(id, fingerprint, origin, path, title, schema_json)
      VALUES ($1, $2, $3, $4, $5, $6::jsonb)
      ON CONFLICT(fingerprint) DO UPDATE SET title = excluded.title, schema_json = excluded.schema_json, updated_at = now()
      RETURNING id
    `, [randomUUID(), fingerprint, url.origin, url.pathname, form.title, JSON.stringify(form)]);
    return result.rows[0]!.id;
  }

  async ensureConversation(candidate: string | undefined, formSnapshotId: string): Promise<string> {
    if (candidate) {
      const found = await this.#pool.query<{ id: string }>("SELECT id FROM conversations WHERE id = $1 AND form_snapshot_id = $2", [candidate, formSnapshotId]);
      if (found.rows[0]) return found.rows[0].id;
      throw new Error("Conversation does not belong to the current form snapshot");
    }
    const id = randomUUID();
    await this.#pool.query("INSERT INTO conversations(id, form_snapshot_id) VALUES ($1, $2)", [id, formSnapshotId]);
    return id;
  }

  async turns(conversationId: string, limit = 8): Promise<ConversationTurn[]> {
    const result = await this.#pool.query<ConversationTurn>(`
      SELECT role, content FROM (
        SELECT id, role, content FROM conversation_messages WHERE conversation_id = $1 ORDER BY id DESC LIMIT $2
      ) recent ORDER BY id ASC
    `, [conversationId, Math.min(Math.max(limit, 1), 20)]);
    return result.rows;
  }

  async cached(key: string): Promise<FillProposal[] | null> {
    const result = await this.#pool.query<{ proposals: FillProposal[] }>("SELECT proposals FROM proposal_cache WHERE cache_key = $1", [key]);
    return result.rows[0]?.proposals ?? null;
  }

  async cache(key: string, model: string, proposals: FillProposal[]): Promise<void> {
    await this.#pool.query(`
      INSERT INTO proposal_cache(cache_key, model, proposals) VALUES ($1, $2, $3::jsonb)
      ON CONFLICT(cache_key) DO UPDATE SET model = excluded.model, proposals = excluded.proposals, created_at = now()
    `, [key, model, JSON.stringify(proposals)]);
  }

  async saveTurn(conversationId: string, request: AnalyzeRequest, model: string, proposals: FillProposal[], cached: boolean): Promise<string> {
    const client = await this.#pool.connect();
    try {
      await client.query("BEGIN");
      await this.#message(client, conversationId, "user", { prompt: request.prompt, mode: request.mode, distributions: request.distributions, seed: request.seed });
      await this.#message(client, conversationId, "assistant", { proposals });
      const runId = randomUUID();
      await client.query("INSERT INTO runs(id, conversation_id, mode, model, proposal_count, cached) VALUES ($1, $2, $3, $4, $5, $6)", [runId, conversationId, request.mode, model, proposals.length, cached]);
      await client.query("UPDATE conversations SET updated_at = now() WHERE id = $1", [conversationId]);
      await client.query("COMMIT");
      return runId;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally { client.release(); }
  }

  async saveSyntheticBatch(formSnapshotId: string, model: string, request: unknown, planSummary: string, rows: unknown[]): Promise<string> {
    const id = randomUUID();
    await this.#pool.query(`INSERT INTO synthetic_batches(id, form_snapshot_id, model, request_json, plan_summary, planned_count, rows_json)
      VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7::jsonb)`, [id, formSnapshotId, model, JSON.stringify(request), planSummary, rows.length, JSON.stringify(rows)]);
    return id;
  }

  async #message(client: PoolClient, conversationId: string, role: ConversationTurn["role"], content: unknown): Promise<void> {
    await client.query("INSERT INTO conversation_messages(conversation_id, role, content) VALUES ($1, $2, $3::jsonb)", [conversationId, role, JSON.stringify(content)]);
  }

  async getProfile(): Promise<Profile> {
    const result = await this.#pool.query<{ value_json: Profile }>("SELECT value_json FROM app_settings WHERE key = 'profile'");
    return result.rows[0]?.value_json ?? {};
  }

  async setProfile(profile: Profile): Promise<void> {
    await this.#pool.query(`INSERT INTO app_settings(key, value_json) VALUES ('profile', $1::jsonb)
      ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = now()`, [JSON.stringify(profile)]);
  }

  async history(limit = 30): Promise<unknown[]> {
    const result = await this.#pool.query(`SELECT r.id, r.created_at AS "createdAt", r.mode, r.model,
      r.proposal_count AS "proposalCount", r.cached, c.id AS "conversationId", f.origin, f.path, f.title
      FROM runs r JOIN conversations c ON c.id = r.conversation_id JOIN form_snapshots f ON f.id = c.form_snapshot_id
      ORDER BY r.created_at DESC LIMIT $1`, [Math.min(Math.max(limit, 1), 100)]);
    return result.rows;
  }

  async clear(): Promise<void> { await this.#pool.query("TRUNCATE synthetic_batches, runs, conversation_messages, conversations, form_snapshots, proposal_cache, app_settings CASCADE"); }
  async onApplicationShutdown(): Promise<void> { await this.#pool.end(); }
}
