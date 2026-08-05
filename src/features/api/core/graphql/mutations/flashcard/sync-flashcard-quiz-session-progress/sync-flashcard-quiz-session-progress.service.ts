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
    SyncFlashcardQuizSessionProgressCommand,
} from "./sync-flashcard-quiz-session-progress.command"
import {
    SyncFlashcardQuizSessionProgressRequest,
    SyncFlashcardQuizSessionProgressData,
} from "./graphql-types"

@Injectable()
/**
 * Thin `CommandBus` proxy for `syncFlashcardQuizSessionProgress` — wraps the request into a
 * {@link SyncFlashcardQuizSessionProgressCommand} rather than calling {@link SyncFlashcardQuizSessionProgressHandler} directly,
 * keeping the resolver decoupled from the CQRS wiring.
 */
export class SyncFlashcardQuizSessionProgressService {
    constructor(
        private readonly commandBus: CommandBus,
    ) { }

    /**
     * Dispatches the wrapped command and returns whatever {@link SyncFlashcardQuizSessionProgressHandler} resolves.
     * @param params - the request + caller, threaded straight into {@link SyncFlashcardQuizSessionProgressCommand}.
     * @returns the handler's result.
     */
    async execute(
        params: ExecuteParams<SyncFlashcardQuizSessionProgressRequest>,
    ): Promise<SyncFlashcardQuizSessionProgressData> {
        return this.commandBus.execute(
            new SyncFlashcardQuizSessionProgressCommand(params),
        )
    }
}
