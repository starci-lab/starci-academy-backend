import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    StartFlashcardQuizSessionRequest,
} from "./graphql-types/request"

/**
 * CQRS command wrapping the `startFlashcardQuizSession` request + caller -- dispatched via
 * `CommandBus` from {@link StartFlashcardQuizSessionService} to {@link StartFlashcardQuizSessionHandler}, so the
 * resolver never depends on the handler's concrete location or implementation.
 */
export class StartFlashcardQuizSessionCommand {
    constructor(
        readonly params: ExecuteParams<StartFlashcardQuizSessionRequest>,
    ) { }
}
