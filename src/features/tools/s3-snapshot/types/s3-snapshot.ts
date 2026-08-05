import type {
    S3Client,
} from "@aws-sdk/client-s3"

/**
 * Parameters for {@link S3SnapshotService.execute}.
 *
 * The credentials and endpoint are supplied per request because the operator
 * points this tool at an arbitrary remote S3-compatible server (not the app's
 * own configured MinIO/DigitalOcean clients).
 */
export interface S3SnapshotParams {
    /** S3-compatible endpoint URL (e.g. https://sfo3.digitaloceanspaces.com). */
    endpoint: string
    /** Region the bucket lives in (e.g. "sfo3", "us-east-1"). */
    region: string
    /** Access key id for the remote server. */
    accessKeyId: string
    /** Secret access key for the remote server. */
    secretAccessKey: string
    /** Bucket to snapshot. */
    bucket: string
    /** Optional key prefix to restrict the snapshot to a sub-tree. */
    prefix?: string
    /** Force path-style addressing (required by MinIO and many self-hosts). */
    forcePathStyle?: boolean
}

/**
 * Result of a bucket snapshot run.
 */
export interface S3SnapshotResult {
    /** Registry id of the produced artifact. */
    artifactId: string
    /** Local directory the objects were written into. */
    directory: string
    /** Number of objects successfully downloaded. */
    downloaded: number
    /** Object keys that failed to download (empty on a clean run). */
    failed: Array<string>
    /** Total bytes written across all downloaded objects. */
    totalBytes: number
}

/**
 * Params for {@link S3SnapshotService.downloadOne}.
 */
export interface DownloadOneParams {
    /** Client bound to the remote server's credentials/endpoint. */
    client: S3Client
    /** Bucket the object lives in. */
    bucket: string
    /** Object key to download. */
    key: string
    /** Local directory the object is mirrored into. */
    directory: string
}
