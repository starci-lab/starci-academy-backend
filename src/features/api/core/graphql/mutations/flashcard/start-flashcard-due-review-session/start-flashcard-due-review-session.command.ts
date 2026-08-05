import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    StartFlashcardDueReviewSessionRequest,
} from "./graphql-types/request"

/**
 * CQRS command wrapping the `startFlashcardDueReviewSession` request + caller -- dispatched via
 * `CommandBus` from {@link StartFlashcardDueReviewSessionService} to {@link StartFlashcardDueReviewSessionHandler}, so the
 * resolver never depends on the handler's concrete location or implementation.
 */
export class StartFlashcardDueReviewSessionCommand {
    constructor(
        readonly params: ExecuteParams<StartFlashcardDueReviewSessionRequest>,
    ) { }
}
