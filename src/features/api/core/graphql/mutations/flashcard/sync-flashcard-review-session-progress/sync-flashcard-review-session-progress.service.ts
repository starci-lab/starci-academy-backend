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

@Injectable()
export class SyncFlashcardReviewSessionProgressService {
    constructor(
        private readonly commandBus: CommandBus,
    ) { }

    async execute(
        params: ExecuteParams<SyncFlashcardReviewSessionProgressRequest>,
    ): Promise<SyncFlashcardReviewSessionProgressData> {
        return this.commandBus.execute(
            new SyncFlashcardReviewSessionProgressCommand(params),
        )
    }
}
