import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    StartFlashcardReviewSessionRequest,
} from "./graphql-types"

/**
 * CQRS command wrapping the `startFlashcardReviewSession` request + caller -- dispatched via
 * `CommandBus` from {@link StartFlashcardReviewSessionService} to {@link StartFlashcardReviewSessionHandler}, so the
 * resolver never depends on the handler's concrete location or implementation.
 */
export class StartFlashcardReviewSessionCommand {
    constructor(
        readonly params: ExecuteParams<StartFlashcardReviewSessionRequest>,
    ) { }
}
