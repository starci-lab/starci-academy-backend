import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    SyncFlashcardReviewSessionProgressRequest,
} from "./graphql-types"

/**
 * CQRS command wrapping the `syncFlashcardReviewSessionProgress` request + caller -- dispatched via
 * `CommandBus` from {@link SyncFlashcardReviewSessionProgressService} to {@link SyncFlashcardReviewSessionProgressHandler}, so the
 * resolver never depends on the handler's concrete location or implementation.
 */
export class SyncFlashcardReviewSessionProgressCommand {
    constructor(
        readonly params: ExecuteParams<SyncFlashcardReviewSessionProgressRequest>,
    ) { }
}
