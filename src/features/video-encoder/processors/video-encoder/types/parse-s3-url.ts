import type {
    S3Provider,
} from "@modules/s3"

/**
 * Result of detecting the S3 provider from a URL and extracting its object key.
 */
export interface ParseS3UrlResult {
    /** Detected S3 provider (MinIO or DigitalOcean) the URL belongs to. */
    provider: S3Provider
    /** Object key (path after the bucket segment) used to fetch the object. */
    key: string
}
