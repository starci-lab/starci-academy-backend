import {
    Injectable,
    OnModuleInit,
} from "@nestjs/common"
import {
    DatabaseSync,
} from "node:sqlite"
import {
    randomUUID,
} from "crypto"
import {
    mkdirSync,
} from "fs"
import {
    dirname,
} from "path"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    ArtifactStatus,
} from "./enums/store"
import type {
    ArtifactRow,
    CreateArtifactParams,
    CreateS3TargetParams,
    S3TargetRow,
    UpdateArtifactSyncParams,
    UpdateS3TargetParams,
} from "./types/store"

@Injectable()
/**
 * Local SQLite store for the ops console: saved S3 targets + an artifact
 * registry.
 *
 * Backed by Node's built-in `node:sqlite` (no native dependency). The store is
 * what makes the "build locally, sync to cloud, re-sync later" flow possible --
 * every produced artifact is registered with its local path and (optionally) a
 * target, so it can be listed and pushed again without recomputing.
 */
export class ToolsStoreService implements OnModuleInit {
    private db!: DatabaseSync

    constructor(
        private readonly winstonService: WinstonService,
    ) {}

    /**
     * Open the database file and create the schema on first boot.
     */
    onModuleInit(): void {
        const path = envConfig().tools.dbPath
        // the db lives under the snapshot root -- ensure the folder exists first
        mkdirSync(dirname(path),
            {
                recursive: true,
            })
        this.db = new DatabaseSync(path)
        // create both tables if absent; ids are app-generated uuids
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS s3_targets (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                endpoint TEXT NOT NULL,
                region TEXT NOT NULL,
                access_key_id TEXT NOT NULL,
                secret_access_key TEXT NOT NULL,
                bucket TEXT NOT NULL,
                force_path_style INTEGER NOT NULL DEFAULT 1,
                created_at INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS artifacts (
                id TEXT PRIMARY KEY,
                type TEXT NOT NULL,
                label TEXT,
                local_path TEXT NOT NULL,
                key_prefix TEXT,
                target_ids TEXT,
                status TEXT NOT NULL,
                bytes INTEGER,
                meta TEXT,
                created_at INTEGER NOT NULL,
                synced_at INTEGER
            );
        `)
        // migrate older DBs that predate multi-target support (single target_id
        // column) -- add the JSON array column; ignore if it already exists
        try {
            this.db.exec("ALTER TABLE artifacts ADD COLUMN target_ids TEXT")
        } catch {
            // column already present -- nothing to do
        }
        this.winstonService.log(WinstonLog.ToolsOperationCompleted,
            {
                op: "tools.store.ready",
                meta: {
                    path,
                },
            })
    }

    /**
     * Persist a new S3 target and return the stored row.
     */
    createTarget(params: CreateS3TargetParams): S3TargetRow {
        const row: S3TargetRow = {
            id: randomUUID(),
            ...params,
            createdAt: Date.now(),
        }
        this.db
            .prepare(`
                INSERT INTO s3_targets
                    (id, name, endpoint, region, access_key_id, secret_access_key, bucket, force_path_style, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `)
            .run(
                row.id,
                row.name,
                row.endpoint,
                row.region,
                row.accessKeyId,
                row.secretAccessKey,
                row.bucket,
                // sqlite has no boolean -- store path-style flag as 0/1
                row.forcePathStyle ? 1 : 0,
                row.createdAt,
            )
        return row
    }

    /**
     * List all saved targets (newest first). Secrets are redacted for safe
     * display; the unredacted secret stays server-side for sync.
     */
    listTargets(): Array<Omit<S3TargetRow, "secretAccessKey">> {
        const rows = this.db
            .prepare("SELECT * FROM s3_targets ORDER BY created_at DESC")
            .all() as Array<Record<string, unknown>>
        // never leak the secret to the dashboard listing -- omit it explicitly
        return rows.map((r) => {
            const target = this.mapTarget(r)
            return {
                id: target.id,
                name: target.name,
                endpoint: target.endpoint,
                region: target.region,
                accessKeyId: target.accessKeyId,
                bucket: target.bucket,
                forcePathStyle: target.forcePathStyle,
                createdAt: target.createdAt,
            }
        })
    }

    /**
     * Fetch a single target (including its secret) for server-side use, or null.
     */
    getTarget(id: string): S3TargetRow | null {
        const row = this.db
            .prepare("SELECT * FROM s3_targets WHERE id = ?")
            .get(id) as Record<string, unknown> | undefined
        return row ? this.mapTarget(row) : null
    }

    /**
     * Update an existing target's fields (merging over the current row).
     *
     * Lets the operator fix wrong credentials in place so registered artifacts
     * (which reference the target by id) can be re-synced without re-uploading.
     *
     * @returns The merged row, or null when the id does not exist.
     */
    updateTarget(params: UpdateS3TargetParams): S3TargetRow | null {
        // start from the existing row so omitted fields are preserved
        const existing = this.getTarget(params.id)
        if (!existing) {
            return null
        }
        const merged: S3TargetRow = {
            ...existing,
            name: params.name ?? existing.name,
            endpoint: params.endpoint ?? existing.endpoint,
            region: params.region ?? existing.region,
            accessKeyId: params.accessKeyId ?? existing.accessKeyId,
            secretAccessKey: params.secretAccessKey ?? existing.secretAccessKey,
            bucket: params.bucket ?? existing.bucket,
            forcePathStyle: params.forcePathStyle ?? existing.forcePathStyle,
        }
        this.db
            .prepare(`
                UPDATE s3_targets
                SET name = ?, endpoint = ?, region = ?, access_key_id = ?, secret_access_key = ?, bucket = ?, force_path_style = ?
                WHERE id = ?
            `)
            .run(
                merged.name,
                merged.endpoint,
                merged.region,
                merged.accessKeyId,
                merged.secretAccessKey,
                merged.bucket,
                merged.forcePathStyle ? 1 : 0,
                merged.id,
            )
        return merged
    }

    /**
     * Delete a target by id. Returns true when a row was removed.
     */
    deleteTarget(id: string): boolean {
        const result = this.db
            .prepare("DELETE FROM s3_targets WHERE id = ?")
            .run(id)
        return result.changes > 0
    }

    /**
     * Register a new artifact row and return it.
     */
    createArtifact(params: CreateArtifactParams): ArtifactRow {
        const row: ArtifactRow = {
            id: randomUUID(),
            type: params.type,
            label: params.label ?? null,
            localPath: params.localPath,
            keyPrefix: params.keyPrefix ?? null,
            targetIds: params.targetIds ?? [],
            status: ArtifactStatus.Local,
            bytes: null,
            meta: params.meta != null ? JSON.stringify(params.meta) : null,
            createdAt: Date.now(),
            syncedAt: null,
        }
        this.db
            .prepare(`
                INSERT INTO artifacts
                    (id, type, label, local_path, key_prefix, target_ids, status, bytes, meta, created_at, synced_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `)
            .run(
                row.id,
                row.type,
                row.label,
                row.localPath,
                row.keyPrefix,
                // store the target id list as a JSON array
                JSON.stringify(row.targetIds),
                row.status,
                row.bytes,
                row.meta,
                row.createdAt,
                row.syncedAt,
            )
        return row
    }

    /**
     * List all artifacts (newest first).
     */
    listArtifacts(): Array<ArtifactRow> {
        const rows = this.db
            .prepare("SELECT * FROM artifacts ORDER BY created_at DESC")
            .all() as Array<Record<string, unknown>>
        return rows.map((r) => this.mapArtifact(r))
    }

    /**
     * Fetch a single artifact by id, or null.
     */
    getArtifact(id: string): ArtifactRow | null {
        const row = this.db
            .prepare("SELECT * FROM artifacts WHERE id = ?")
            .get(id) as Record<string, unknown> | undefined
        return row ? this.mapArtifact(row) : null
    }

    /**
     * Update an artifact's sync state after a push attempt.
     */
    updateArtifactSync(
        {
            id,
            status,
            bytes,
            syncedAt,
        }: UpdateArtifactSyncParams,
    ): void {
        this.db
            .prepare("UPDATE artifacts SET status = ?, bytes = ?, synced_at = ? WHERE id = ?")
            .run(
                status,
                bytes ?? null,
                syncedAt ?? null,
                id,
            )
    }

    /**
     * Delete an artifact row by id. Returns true when a row was removed.
     */
    deleteArtifact(id: string): boolean {
        const result = this.db
            .prepare("DELETE FROM artifacts WHERE id = ?")
            .run(id)
        return result.changes > 0
    }

    /**
     * Map a raw sqlite row to a typed {@link S3TargetRow}.
     */
    private mapTarget(row: Record<string, unknown>): S3TargetRow {
        return {
            id: row.id as string,
            name: row.name as string,
            endpoint: row.endpoint as string,
            region: row.region as string,
            accessKeyId: row.access_key_id as string,
            secretAccessKey: row.secret_access_key as string,
            bucket: row.bucket as string,
            // 0/1 back to boolean
            forcePathStyle: Number(row.force_path_style) === 1,
            createdAt: Number(row.created_at),
        }
    }

    /**
     * Map a raw sqlite row to a typed {@link ArtifactRow}.
     */
    private mapArtifact(row: Record<string, unknown>): ArtifactRow {
        return {
            id: row.id as string,
            type: row.type as ArtifactRow["type"],
            label: (row.label as string | null) ?? null,
            localPath: row.local_path as string,
            keyPrefix: (row.key_prefix as string | null) ?? null,
            // target_ids is a JSON array; tolerate null/legacy/malformed -> []
            targetIds: this.parseTargetIds(row.target_ids as string | null),
            status: row.status as ArtifactRow["status"],
            bytes: row.bytes != null ? Number(row.bytes) : null,
            meta: (row.meta as string | null) ?? null,
            createdAt: Number(row.created_at),
            syncedAt: row.synced_at != null ? Number(row.synced_at) : null,
        }
    }

    /**
     * Parse the stored `target_ids` JSON into a string array, defensively
     * returning `[]` for null, legacy single ids, or malformed values.
     */
    private parseTargetIds(raw: string | null): Array<string> {
        if (!raw) {
            return []
        }
        try {
            const parsed = JSON.parse(raw)
            return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : []
        } catch {
            return []
        }
    }
}
