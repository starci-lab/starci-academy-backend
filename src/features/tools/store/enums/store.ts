/**
 * The kind of local artifact a registry row represents.
 */
export enum ArtifactType {
    /** Raw file(s) uploaded as-is by the upload tool. */
    Upload = "upload",
    /** Multi-bitrate mp4 renditions produced by the media tool. */
    Media = "media",
    /** MPEG-DASH manifest + segments produced by the dash tool. */
    Dash = "dash",
    /** Encrypted PostgreSQL dump produced by the backup tool. */
    PgBackup = "pg-backup",
    /** Custom-format PostgreSQL dump produced by the snapshot tool. */
    PgSnapshot = "pg-snapshot",
    /** Mirror of a remote S3 bucket produced by the s3-snapshot tool. */
    S3Snapshot = "s3-snapshot",
}

/**
 * Lifecycle state of a local artifact relative to its cloud target.
 */
export enum ArtifactStatus {
    /** Built locally; not (yet) pushed to a cloud target. */
    Local = "local",
    /** Successfully synced to its cloud target. */
    Synced = "synced",
    /** A sync attempt failed; the local artifact is still intact. */
    Error = "error",
}
