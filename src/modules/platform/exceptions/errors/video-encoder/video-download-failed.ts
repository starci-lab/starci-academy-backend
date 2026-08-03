import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a video-encoder init step whose S3 download returned no bytes. */
export interface VideoDownloadFailedExceptionMetadata extends AbstractExceptionMetadata {
    /** Source video URL. */
    url: string
    /** Resolved S3 provider. */
    provider: string
    /** Resolved S3 object key. */
    key: string
}

/**
 * Thrown when the video-encoder init step downloads a source video via
 * `S3ReadService.buffer` but gets back an empty (or missing) buffer.
 */
export class VideoDownloadFailedException extends AbstractException {
    constructor({
        url,
        provider,
        key,
        originalError,
    }: VideoDownloadFailedExceptionMetadata) {
        super(
            "Failed to download video.",
            "VIDEO_DOWNLOAD_FAILED_EXCEPTION",
            {
                url,
                provider,
                key,
                originalError,
            },
            HttpStatus.INTERNAL_SERVER_ERROR,
        )
    }
}
