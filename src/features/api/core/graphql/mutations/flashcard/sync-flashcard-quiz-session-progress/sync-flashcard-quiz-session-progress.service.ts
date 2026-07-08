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
export class SyncFlashcardQuizSessionProgressService {
    constructor(
        private readonly commandBus: CommandBus,
    ) { }

    async execute(
        params: ExecuteParams<SyncFlashcardQuizSessionProgressRequest>,
    ): Promise<SyncFlashcardQuizSessionProgressData> {
        return this.commandBus.execute(
            new SyncFlashcardQuizSessionProgressCommand(params),
        )
    }
}
