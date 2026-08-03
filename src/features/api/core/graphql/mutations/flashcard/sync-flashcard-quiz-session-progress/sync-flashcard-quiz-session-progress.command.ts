import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    SyncFlashcardQuizSessionProgressRequest,
} from "./graphql-types"

/**
 * CQRS command wrapping the `syncFlashcardQuizSessionProgress` request + caller — dispatched via
 * `CommandBus` from {@link SyncFlashcardQuizSessionProgressService} to {@link SyncFlashcardQuizSessionProgressHandler}, so the
 * resolver never depends on the handler's concrete location or implementation.
 */
export class SyncFlashcardQuizSessionProgressCommand {
    constructor(
        readonly params: ExecuteParams<SyncFlashcardQuizSessionProgressRequest>,
    ) { }
}
