import type {
    ArtifactStatus,
    ArtifactType,
} from "../enums/store"

/**
 * A saved S3-compatible target (credentials live locally in SQLite so the
 * operator can reuse a destination without re-typing creds each sync).
 */
export interface S3TargetRow {
    /** Stable uuid primary key. */
    id: string
    /** Human label, unique. */
    name: string
    /** S3-compatible endpoint URL. */
    endpoint: string
    /** Region the bucket lives in. */
    region: string
    /** Access key id. */
    accessKeyId: string
    /** Secret access key. */
    secretAccessKey: string
    /** Destination bucket. */
    bucket: string
    /** Whether to force path-style addressing (MinIO/self-hosts need this). */
    forcePathStyle: boolean
    /** Creation time (epoch ms). */
    createdAt: number
}

/**
 * Parameters to persist a new S3 target.
 */
export interface CreateS3TargetParams {
    /** Human label, unique. */
    name: string
    /** S3-compatible endpoint URL. */
    endpoint: string
    /** Region the bucket lives in. */
    region: string
    /** Access key id. */
    accessKeyId: string
    /** Secret access key. */
    secretAccessKey: string
    /** Destination bucket. */
    bucket: string
    /** Whether to force path-style addressing. */
    forcePathStyle: boolean
}

/**
 * Parameters to update an existing S3 target (all fields but id optional).
 */
export interface UpdateS3TargetParams {
    /** Id of the target to update. */
    id: string
    /** New human label. */
    name?: string
    /** New endpoint URL. */
    endpoint?: string
    /** New region. */
    region?: string
    /** New access key id. */
    accessKeyId?: string
    /** New secret access key. */
    secretAccessKey?: string
    /** New bucket. */
    bucket?: string
    /** New path-style flag. */
    forcePathStyle?: boolean
}

/**
 * A registered local artifact (a file or directory on disk) and its cloud
 * sync state.
 */
export interface ArtifactRow {
    /** Stable uuid primary key. */
    id: string
    /** The kind of artifact. */
    type: ArtifactType
    /** Optional operator-facing label. */
    label: string | null
    /** Absolute path of the artifact (a file or a directory). */
    localPath: string
    /** Destination key prefix inside the target bucket, when a target is set. */
    keyPrefix: string | null
    /** FK ids into `s3_targets`; empty when the artifact is local-only. */
    targetIds: Array<string>
    /** Lifecycle state relative to the target(s). */
    status: ArtifactStatus
    /** Total bytes synced on the last successful push (null until synced). */
    bytes: number | null
    /** Arbitrary JSON metadata (tool-specific details). */
    meta: string | null
    /** Creation time (epoch ms). */
    createdAt: number
    /** Last successful sync time (epoch ms), or null. */
    syncedAt: number | null
}

/**
 * Parameters to register a new artifact.
 */
export interface CreateArtifactParams {
    /** The kind of artifact. */
    type: ArtifactType
    /** Optional operator-facing label. */
    label?: string
    /** Absolute path of the artifact (a file or a directory). */
    localPath: string
    /** Destination key prefix inside the target bucket, when syncing. */
    keyPrefix?: string
    /** FK ids into `s3_targets`; omit/empty for a local-only artifact. */
    targetIds?: Array<string>
    /** Arbitrary JSON-serializable metadata. */
    meta?: unknown
}

/**
 * Patch applied after a sync attempt completes.
 */
export interface UpdateArtifactSyncParams {
    /** Artifact id to update. */
    id: string
    /** New lifecycle state. */
    status: ArtifactStatus
    /** Bytes synced (on success). */
    bytes?: number
    /** Sync completion time (epoch ms, on success). */
    syncedAt?: number
}
