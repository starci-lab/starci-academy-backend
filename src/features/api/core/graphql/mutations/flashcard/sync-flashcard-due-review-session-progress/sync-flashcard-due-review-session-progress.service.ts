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
export class SyncFlashcardDueReviewSessionProgressService {
    constructor(
        private readonly commandBus: CommandBus,
    ) { }

    async execute(
        params: ExecuteParams<SyncFlashcardDueReviewSessionProgressRequest>,
    ): Promise<SyncFlashcardDueReviewSessionProgressData> {
        return this.commandBus.execute(
            new SyncFlashcardDueReviewSessionProgressCommand(params),
        )
    }
}
