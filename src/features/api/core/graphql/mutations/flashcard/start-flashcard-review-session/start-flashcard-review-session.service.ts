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
export class StartFlashcardReviewSessionService {
    constructor(
        private readonly commandBus: CommandBus,
    ) { }

    async execute(
        params: ExecuteParams<StartFlashcardReviewSessionRequest>,
    ): Promise<StartFlashcardReviewSessionData> {
        return this.commandBus.execute(
            new StartFlashcardReviewSessionCommand(params),
        )
    }
}
