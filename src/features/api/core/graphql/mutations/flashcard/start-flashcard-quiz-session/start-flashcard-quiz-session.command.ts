import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    StartFlashcardQuizSessionRequest,
} from "./graphql-types"

/**
 * CQRS command wrapping the `startFlashcardQuizSession` request + caller — dispatched via
 * `CommandBus` from {@link StartFlashcardQuizSessionService} to {@link StartFlashcardQuizSessionHandler}, so the
 * resolver never depends on the handler's concrete location or implementation.
 */
export class StartFlashcardQuizSessionCommand {
    constructor(
        readonly params: ExecuteParams<StartFlashcardQuizSessionRequest>,
    ) { }
}
