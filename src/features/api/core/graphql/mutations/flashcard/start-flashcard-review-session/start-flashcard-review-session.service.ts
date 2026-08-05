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
    StartFlashcardReviewSessionCommand,
} from "./start-flashcard-review-session.command"
import {
    StartFlashcardReviewSessionRequest,
    StartFlashcardReviewSessionData,
} from "./graphql-types"

@Injectable()
/**
 * Thin `CommandBus` proxy for `startFlashcardReviewSession` — wraps the request into a
 * {@link StartFlashcardReviewSessionCommand} rather than calling {@link StartFlashcardReviewSessionHandler} directly,
 * keeping the resolver decoupled from the CQRS wiring.
 */
export class StartFlashcardReviewSessionService {
    constructor(
        private readonly commandBus: CommandBus,
    ) { }

    /**
     * Dispatches the wrapped command and returns whatever {@link StartFlashcardReviewSessionHandler} resolves.
     * @param params - the request + caller, threaded straight into {@link StartFlashcardReviewSessionCommand}.
     * @returns the handler's result.
     */
    async execute(
        params: ExecuteParams<StartFlashcardReviewSessionRequest>,
    ): Promise<StartFlashcardReviewSessionData> {
        return this.commandBus.execute(
            new StartFlashcardReviewSessionCommand(params),
        )
    }
}
