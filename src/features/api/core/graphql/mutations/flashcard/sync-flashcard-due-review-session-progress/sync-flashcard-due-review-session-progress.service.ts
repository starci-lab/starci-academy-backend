import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    SyncFlashcardDueReviewSessionProgressCommand,
} from "./sync-flashcard-due-review-session-progress.command"
import {
    SyncFlashcardDueReviewSessionProgressRequest,
    SyncFlashcardDueReviewSessionProgressData,
} from "./graphql-types"

@Injectable()
/**
 * Thin `CommandBus` proxy for `syncFlashcardDueReviewSessionProgress` -- wraps the request into a
 * {@link SyncFlashcardDueReviewSessionProgressCommand} rather than calling {@link SyncFlashcardDueReviewSessionProgressHandler} directly,
 * keeping the resolver decoupled from the CQRS wiring.
 */
export class SyncFlashcardDueReviewSessionProgressService {
    constructor(
        private readonly commandBus: CommandBus,
    ) { }

    /**
     * Dispatches the wrapped command and returns whatever {@link SyncFlashcardDueReviewSessionProgressHandler} resolves.
     * @param params - the request + caller, threaded straight into {@link SyncFlashcardDueReviewSessionProgressCommand}.
     * @returns the handler's result.
     */
    async execute(
        params: ExecuteParams<SyncFlashcardDueReviewSessionProgressRequest>,
    ): Promise<SyncFlashcardDueReviewSessionProgressData> {
        return this.commandBus.execute(
            new SyncFlashcardDueReviewSessionProgressCommand(params),
        )
    }
}
