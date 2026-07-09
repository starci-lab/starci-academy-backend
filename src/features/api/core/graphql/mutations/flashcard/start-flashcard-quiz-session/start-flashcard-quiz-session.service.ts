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
export class StartFlashcardQuizSessionService {
    constructor(
        private readonly commandBus: CommandBus,
    ) { }

    async execute(
        params: ExecuteParams<StartFlashcardQuizSessionRequest>,
    ): Promise<StartFlashcardQuizSessionData> {
        return this.commandBus.execute(
            new StartFlashcardQuizSessionCommand(params),
        )
    }
}
