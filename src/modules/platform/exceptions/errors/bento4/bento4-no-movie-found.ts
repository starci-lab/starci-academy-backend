import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a Bento4 `mp4info` probe that found no movie in the file. */
export type Bento4NoMovieFoundExceptionMetadata = AbstractExceptionMetadata

/**
 * Thrown when Bento4's `mp4info` reports "No movie found in the file" —
 * the input is not a valid MP4/fragmented MP4.
 */
export class Bento4NoMovieFoundException extends AbstractException {
    constructor({
        originalError,
    }: Bento4NoMovieFoundExceptionMetadata) {
        super(
            "No movie found in the file.",
            "BENTO4_NO_MOVIE_FOUND_EXCEPTION",
            {
                originalError,
            },
            HttpStatus.BAD_REQUEST,
        )
    }
}
