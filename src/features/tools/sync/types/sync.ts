import type {
    ArtifactStatus,
} from "../../store/enums/store"
import type {
    S3TargetRow,
} from "../../store/types/store"

/**
 * Parameters for {@link SyncService.pushToTarget}.
 */
export interface PushToTargetParams {
    /** Absolute path of the artifact to push (a file or a directory). */
    localPath: string
    /** The destination target (credentials + bucket). */
    target: S3TargetRow
    /** Key prefix every uploaded object is placed under. */
    keyPrefix: string
}

/**
 * One regular file collected for upload, with its key relative to the sync root.
 */
export interface SyncFileEntry {
    /** Absolute filesystem path of the file to upload. */
    absolutePath: string
    /** Object key relative to the sync root (mirrors the directory tree). */
    relativeKey: string
    /** File size in bytes. */
    size: number
}

/**
 * Aggregate outcome of pushing one artifact.
 */
export interface PushResult {
    /** Number of files uploaded. */
    files: number
    /** Total bytes uploaded. */
    bytes: number
    /** The object keys that were written. */
    keys: Array<string>
}

/**
 * Per-target outcome within a sync run.
 */
export interface SyncTargetResult {
    /** The target id pushed to. */
    targetId: string
    /** The target's human name. */
    targetName: string
    /** Whether the push to this target succeeded. */
    ok: boolean
    /** Number of files uploaded to this target (when ok). */
    files: number
    /** Bytes uploaded to this target (when ok). */
    bytes: number
    /** Failure reason when not ok. */
    error?: string
}

/**
 * Result of (re-)syncing a registered artifact to all its targets.
 */
export interface SyncArtifactResult {
    /** The artifact that was synced. */
    artifactId: string
    /** Its new lifecycle status (synced only when every target succeeded). */
    status: ArtifactStatus
    /** Number of files uploaded to the first/representative target. */
    files: number
    /** Total bytes uploaded across all targets. */
    bytes: number
    /** Per-target breakdown. */
    targets: Array<SyncTargetResult>
}
