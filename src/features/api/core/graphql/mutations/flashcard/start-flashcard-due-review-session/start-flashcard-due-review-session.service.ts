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
export class StartFlashcardDueReviewSessionService {
    constructor(
        private readonly commandBus: CommandBus,
    ) { }

    async execute(
        params: ExecuteParams<StartFlashcardDueReviewSessionRequest>,
    ): Promise<StartFlashcardDueReviewSessionData> {
        return this.commandBus.execute(
            new StartFlashcardDueReviewSessionCommand(params),
        )
    }
}
