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
    StartFlashcardQuizSessionCommand,
} from "./start-flashcard-quiz-session.command"
import {
    StartFlashcardQuizSessionRequest,
    StartFlashcardQuizSessionData,
} from "./graphql-types"

@Injectable()
/**
 * Thin `CommandBus` proxy for `startFlashcardQuizSession` — wraps the request into a
 * {@link StartFlashcardQuizSessionCommand} rather than calling {@link StartFlashcardQuizSessionHandler} directly,
 * keeping the resolver decoupled from the CQRS wiring.
 */
export class StartFlashcardQuizSessionService {
    constructor(
        private readonly commandBus: CommandBus,
    ) { }

    /**
     * Dispatches the wrapped command and returns whatever {@link StartFlashcardQuizSessionHandler} resolves.
     * @param params - the request + caller, threaded straight into {@link StartFlashcardQuizSessionCommand}.
     * @returns the handler's result.
     */
    async execute(
        params: ExecuteParams<StartFlashcardQuizSessionRequest>,
    ): Promise<StartFlashcardQuizSessionData> {
        return this.commandBus.execute(
            new StartFlashcardQuizSessionCommand(params),
        )
    }
}
