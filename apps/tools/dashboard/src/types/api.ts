/** A saved S3 target (secret omitted by the API listing). */
export interface Target {
    /** Stable identifier of the target. */
    id: string
    /** Human-readable display name. */
    name: string
    /** S3-compatible endpoint URL. */
    endpoint: string
    /** Bucket region code. */
    region: string
    /** Destination bucket name. */
    bucket: string
}

/** A registered local artifact row. */
export interface Artifact {
    /** Stable identifier of the artifact. */
    id: string
    /** Artifact type discriminator (e.g. media, dash, pg). */
    type: string
    /** Optional human-readable label. */
    label: string | null
    /** Absolute path to the artifact on local disk. */
    localPath: string
    /** Optional key prefix applied when syncing to a target. */
    keyPrefix: string | null
    /** Ids of targets this artifact is associated with. */
    targetIds: Array<string>
    /** Current lifecycle status string. */
    status: string
    /** Size of the artifact in bytes, when known. */
    bytes: number | null
    /** Creation timestamp (epoch millis). */
    createdAt: number
    /** Last successful sync timestamp (epoch millis), when synced. */
    syncedAt: number | null
}
