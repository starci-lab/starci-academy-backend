import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    SyncFlashcardDueReviewSessionProgressRequest,
} from "./graphql-types"

/**
 * CQRS command wrapping the `syncFlashcardDueReviewSessionProgress` request + caller -- dispatched via
 * `CommandBus` from {@link SyncFlashcardDueReviewSessionProgressService} to {@link SyncFlashcardDueReviewSessionProgressHandler}, so the
 * resolver never depends on the handler's concrete location or implementation.
 */
export class SyncFlashcardDueReviewSessionProgressCommand {
    constructor(
        readonly params: ExecuteParams<SyncFlashcardDueReviewSessionProgressRequest>,
    ) { }
}
