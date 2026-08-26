import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for an optimistic-concurrency draft conflict. */
export interface ChallengeDraftRevisionConflictExceptionMetadata extends AbstractExceptionMetadata {
    submissionId: string
    expectedRevision: number
    currentRevision: number
}

/** Prevents a stale browser tab from silently replacing a newer Challenge draft. */
export class ChallengeDraftRevisionConflictException extends AbstractException {
    constructor({
        submissionId,
        expectedRevision,
        currentRevision,
        originalError,
    }: ChallengeDraftRevisionConflictExceptionMetadata) {
        super(
            "The challenge draft changed in another session. Load the latest revision or save your work as a new revision.",
            "CHALLENGE_DRAFT_REVISION_CONFLICT_EXCEPTION",
            {
                submissionId,
                expectedRevision,
                currentRevision,
                originalError,
            },
        )
    }
}
