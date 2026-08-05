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
    StartFlashcardDueReviewSessionCommand,
} from "./start-flashcard-due-review-session.command"
import {
    StartFlashcardDueReviewSessionRequest,
    StartFlashcardDueReviewSessionData,
} from "./graphql-types"

@Injectable()
/**
 * Thin `CommandBus` proxy for `startFlashcardDueReviewSession` -- wraps the request into a
 * {@link StartFlashcardDueReviewSessionCommand} rather than calling {@link StartFlashcardDueReviewSessionHandler} directly,
 * keeping the resolver decoupled from the CQRS wiring.
 */
export class StartFlashcardDueReviewSessionService {
    constructor(
        private readonly commandBus: CommandBus,
    ) { }

    /**
     * Dispatches the wrapped command and returns whatever {@link StartFlashcardDueReviewSessionHandler} resolves.
     * @param params - the request + caller, threaded straight into {@link StartFlashcardDueReviewSessionCommand}.
     * @returns the handler's result.
     */
    async execute(
        params: ExecuteParams<StartFlashcardDueReviewSessionRequest>,
    ): Promise<StartFlashcardDueReviewSessionData> {
        return this.commandBus.execute(
            new StartFlashcardDueReviewSessionCommand(params),
        )
    }
}
