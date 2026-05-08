import {
    S3Provider,
} from "@modules/s3"

/**
 * Params for generating presigned upload URLs.
 */
export interface PresignedUrlCommandParams {
    /** The object key (path) to upload to in S3. */
    key: string
    /** The MIME content type of the file to upload. */
    contentType?: string
}

/**
 * Single item in the presigned URL response.
 */
export interface PresignedUrlItem {
    /** The S3 provider name. */
    provider: S3Provider
    /** The presigned upload URL. */
    url: string
}

/**
 * CQRS command for generating presigned upload URLs.
 */
export class PresignedUrlCommand {
    constructor(
        public readonly params: PresignedUrlCommandParams,
    ) {}
}
