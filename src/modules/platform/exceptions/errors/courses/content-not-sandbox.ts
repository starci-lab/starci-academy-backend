import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a sandbox-repo request targeting a non-sandbox content row. */
export interface ContentNotSandboxExceptionMetadata extends AbstractExceptionMetadata {
    /** Id of the content that is not a sandbox lesson. */
    contentId: string
}

/**
 * Thrown when a sandbox-repo-url request targets a `ContentEntity` whose
 * `isSandbox` flag is false -- no bundled file tree to serve.
 */
export class ContentNotSandboxException extends AbstractException {
    constructor({
        contentId,
        originalError,
    }: ContentNotSandboxExceptionMetadata) {
        super(
            "Content is not a sandbox lesson.",
            "CONTENT_NOT_SANDBOX_EXCEPTION",
            {
                contentId,
                originalError,
            },
            HttpStatus.BAD_REQUEST,
        )
    }
}
