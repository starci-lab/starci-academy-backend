import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    SyncFlashcardDueReviewSessionProgressRequest,
} from "./graphql-types/request"

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
