import {
    S3Client,
} from "@aws-sdk/client-s3"
import {
    extname,
} from "path"

/**
 * The connection fields needed to build an S3 client for a remote target.
 */
export interface S3ClientConfig {
    /** S3-compatible endpoint URL. */
    endpoint: string
    /** Region the bucket lives in. */
    region: string
    /** Access key id. */
    accessKeyId: string
    /** Secret access key. */
    secretAccessKey: string
    /** Force path-style addressing (MinIO/self-hosts need this). */
    forcePathStyle: boolean
}

/**
 * Build an ephemeral {@link S3Client} for an arbitrary remote target.
 *
 * Used by the snapshot/sync tools because the operator points at remote servers
 * that are not the app's own configured MinIO/DigitalOcean clients.
 */
export const buildS3Client = (config: S3ClientConfig): S3Client => new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: config.forcePathStyle,
})

/**
 * Best-effort `Content-Type` for an object key based on its extension.
 *
 * Covers the DASH/media outputs the sync tool uploads (.mpd manifests and
 * .m4s/.m4f segments must carry the right type for players to stream them) plus
 * common fallbacks; defaults to a generic binary type.
 */
export const contentTypeForKey = (key: string): string => {
    // lower-case extension without the leading dot
    const ext = extname(key).toLowerCase().replace(".",
        "")
    switch (ext) {
    case "mpd":
        return "application/dash+xml"
    case "m4s":
    case "m4f":
        return "video/iso.segment"
    case "mp4":
        return "video/mp4"
    case "json":
        return "application/json"
    case "txt":
        return "text/plain"
    case "dump":
    case "gz":
    case "enc":
    default:
        // unknown/opaque payloads (dumps, encrypted blobs) -> generic binary
        return "application/octet-stream"
    }
}
