/**
 * Response DTO for view presigned URL.
 */
export class ViewPresignedUrlItem {
    /** S3 provider name. */
    provider: string
    /** Presigned GET URL (5 min expiry). */
    url: string
}
