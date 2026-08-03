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
    SyncFlashcardReviewSessionProgressCommand,
} from "./sync-flashcard-review-session-progress.command"
import {
    SyncFlashcardReviewSessionProgressRequest,
    SyncFlashcardReviewSessionProgressData,
} from "./graphql-types"

/**
 * Thin `CommandBus` proxy for `syncFlashcardReviewSessionProgress` — wraps the request into a
 * {@link SyncFlashcardReviewSessionProgressCommand} rather than calling {@link SyncFlashcardReviewSessionProgressHandler} directly,
 * keeping the resolver decoupled from the CQRS wiring.
 */
@Injectable()
export class SyncFlashcardReviewSessionProgressService {
    constructor(
        private readonly commandBus: CommandBus,
    ) { }

    /**
     * Dispatches the wrapped command and returns whatever {@link SyncFlashcardReviewSessionProgressHandler} resolves.
     * @param params - the request + caller, threaded straight into {@link SyncFlashcardReviewSessionProgressCommand}.
     * @returns the handler's result.
     */
    async execute(
        params: ExecuteParams<SyncFlashcardReviewSessionProgressRequest>,
    ): Promise<SyncFlashcardReviewSessionProgressData> {
        return this.commandBus.execute(
            new SyncFlashcardReviewSessionProgressCommand(params),
        )
    }
}
