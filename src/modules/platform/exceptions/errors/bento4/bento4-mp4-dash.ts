import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a Bento4 `mp4-dash.py` run whose output contained an error line. */
export interface Bento4Mp4DashExceptionMetadata extends AbstractExceptionMetadata {
    /** The `mp4-dash.py` output line that contained "ERROR". */
    stderr: string
}

/**
 * Thrown when Bento4's `mp4-dash.py` output contains an "ERROR" line.
 */
export class Bento4Mp4DashException extends AbstractException {
    constructor({
        stderr,
        originalError,
    }: Bento4Mp4DashExceptionMetadata) {
        super(
            "mp4dash failed.",
            "BENTO4_MP4_DASH_EXCEPTION",
            {
                stderr,
                originalError,
            },
            HttpStatus.INTERNAL_SERVER_ERROR,
        )
    }
}
