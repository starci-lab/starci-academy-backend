import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a sandbox lesson missing its GitHub source config. */
export interface SandboxSourceNotConfiguredExceptionMetadata extends AbstractExceptionMetadata {
    /** Id of the sandbox content row. */
    contentId: string
}

/**
 * Thrown when a sandbox lesson's `githubBaseUrl`/`githubDir` is not set --
 * the lesson is flagged sandbox but has no bundled file tree to serve.
 */
export class SandboxSourceNotConfiguredException extends AbstractException {
    constructor({
        contentId,
        originalError,
    }: SandboxSourceNotConfiguredExceptionMetadata) {
        super(
            "Sandbox source not configured for this lesson.",
            "SANDBOX_SOURCE_NOT_CONFIGURED_EXCEPTION",
            {
                contentId,
                originalError,
            },
            HttpStatus.INTERNAL_SERVER_ERROR,
        )
    }
}
