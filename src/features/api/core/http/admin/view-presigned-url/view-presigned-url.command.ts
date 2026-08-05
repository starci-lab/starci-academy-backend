import {
    S3Provider,
} from "@modules/integrations/s3/enums/s3"

/**
 * Params for getting MPEG-DASH view URLs.
 */
export interface ViewPresignedUrlCommandParams {
    /** Asset ID of the processed video. */
    assetId: string
}

/**
 * Single item in the view presigned URL response.
 */
export interface ViewPresignedUrlItem {
    /** The S3 provider name. */
    provider: S3Provider
    /** Direct URL to manifest.mpd (public-read). */
    manifestUrl: string
}

/**
 * CQRS command for getting MPEG-DASH view URLs.
 */
export class ViewPresignedUrlCommand {
    constructor(
        public readonly params: ViewPresignedUrlCommandParams,
    ) {}
}
