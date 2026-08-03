import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a failed data-git bootstrap (remote data repo fetch/extract). */
export interface DataGitBootstrapExceptionMetadata extends AbstractExceptionMetadata {
    /** Repository owner (GitHub org or user). */
    owner: string
    /** Repository name. */
    repo: string
    /** Git ref being resolved; empty means the repo default branch. */
    ref: string
}

/** Thrown when the data-git bootstrap cannot fetch or extract the remote data repo. */
export class DataGitBootstrapException extends AbstractException {
    constructor(
        {
            owner,
            repo,
            ref,
            originalError,
        }: DataGitBootstrapExceptionMetadata,
    ) {
        super(
            // include owner/repo/ref so logs and Sentry can group on the failing target
            `Failed to bootstrap data repo ${owner}/${repo}@${ref || "default"}`,
            "DATA_GIT_BOOTSTRAP_EXCEPTION",
            {
                owner,
                repo,
                ref,
                originalError,
            },
        )
    }
}
