import type {
    SyncArtifactResult,
} from "../../sync/types/sync"

/**
 * Parameters for {@link PgBackupService.execute}.
 */
export interface PgBackupParams {
    /** Full PostgreSQL connection URL of the database to back up. */
    postgresUrl: string
    /**
     * Local disk directory where the encrypted backup artifact is written
     * (the operator's chosen drive/folder). A per-run subfolder is created
     * inside it and kept as the artifact.
     */
    diskPath: string
    /** Base name used for the temp artifacts and the artifact subfolder. */
    artifactBaseName: string
    /** Saved S3 target ids to sync the artifact to; empty keeps local-only. */
    targetIds: Array<string>
    /** Destination key prefix; a sensible default is used when omitted. */
    keyPrefix?: string
}

/**
 * Result of producing (and optionally syncing) a backup artifact.
 */
export interface PgBackupResult {
    /** Registry id of the produced artifact. */
    artifactId: string
    /** Local directory holding the encrypted backup file. */
    localPath: string
    /** Absolute path of the encrypted backup file. */
    encFile: string
    /** Sync outcome, or null when no target was provided. */
    synced: SyncArtifactResult | null
}
