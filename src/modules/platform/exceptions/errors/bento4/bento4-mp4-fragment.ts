import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a Bento4 `mp4fragment` run whose output contained an error line. */
export interface Bento4Mp4FragmentExceptionMetadata extends AbstractExceptionMetadata {
    /** The `mp4fragment` output line that contained "ERROR". */
    stderr: string
}

/**
 * Thrown when Bento4's `mp4fragment` output contains an "ERROR" line.
 */
export class Bento4Mp4FragmentException extends AbstractException {
    constructor({
        stderr,
        originalError,
    }: Bento4Mp4FragmentExceptionMetadata) {
        super(
            "mp4fragment failed.",
            "BENTO4_MP4_FRAGMENT_EXCEPTION",
            {
                stderr,
                originalError,
            },
            HttpStatus.INTERNAL_SERVER_ERROR,
        )
    }
}
