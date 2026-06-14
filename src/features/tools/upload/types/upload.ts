import type {
    MulterFile,
} from "../../media"
import type {
    SyncArtifactResult,
} from "../../sync"

/**
 * Parameters for {@link UploadService.execute}.
 */
export interface ProcessUploadParams {
    /** The uploaded files (memory storage), or undefined when none. */
    files: Array<MulterFile> | undefined
    /** Saved S3 target ids to sync each file to; empty keeps them local-only. */
    targetIds: Array<string>
    /** Destination key prefix; a sensible default is used when omitted. */
    keyPrefix?: string
}

/**
 * Outcome for one uploaded file.
 */
export interface UploadItemResult {
    /** Original filename. */
    filename: string
    /** Registry id of the produced artifact. */
    artifactId: string
    /** Local path the file was stored at. */
    localPath: string
    /** Sync outcome, or null when no target was provided. */
    synced: SyncArtifactResult | null
}

/**
 * Result of an upload run across every file.
 */
export interface ProcessUploadResult {
    /** Per-file outcomes. */
    items: Array<UploadItemResult>
}
