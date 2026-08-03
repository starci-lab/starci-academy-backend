/** Injection token for DigitalOcean S3 instance specifically. */
export const DIGITAL_OCEAN_S3 = "DIGITAL_OCEAN_S3"

/** DigitalOcean S3 client whose endpoint is used only for presigned URLs / public URL strings. */
export const DIGITAL_OCEAN_S3_PRESIGN = "DIGITAL_OCEAN_S3_PRESIGN"

/** Injection token for MinIO instance specifically. */
export const MINIO_S3 = "MINIO_S3"

/** MinIO S3 client whose endpoint is used only for presigned URLs / public URL strings. */
export const MINIO_S3_PRESIGN = "MINIO_S3_PRESIGN"

/** Object-key prefix under the MinIO bucket that holds synced sandbox repo file trees. */
export const S3_REPO_PREFIX = "repo"

/** Object-key prefix under the MinIO bucket that holds synced static brand assets. */
export const S3_ASSETS_PREFIX = "assets"

/**
 * Every object-key prefix that must be anonymously readable on the MinIO bucket.
 *
 * MinIO exposes a single bucket policy, so the public-read grant has to enumerate
 * ALL public prefixes in one statement — listing them here keeps the policy in one
 * place no matter which synchronizer (repo or assets) re-applies it on boot.
 */
export const S3_PUBLIC_READ_PREFIXES: ReadonlyArray<string> = [
    S3_REPO_PREFIX,
    S3_ASSETS_PREFIX,
]
