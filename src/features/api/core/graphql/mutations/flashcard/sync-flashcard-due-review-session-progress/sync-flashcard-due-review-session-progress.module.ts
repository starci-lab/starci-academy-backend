import {
    Module,
} from "@nestjs/common"
import {
    CqrsModule,
} from "@nestjs/cqrs"
import {
    SyncFlashcardDueReviewSessionProgressResolver,
} from "./sync-flashcard-due-review-session-progress.resolver"
import {
    SyncFlashcardDueReviewSessionProgressService,
} from "./sync-flashcard-due-review-session-progress.service"
import {
    SyncFlashcardDueReviewSessionProgressHandler,
} from "./sync-flashcard-due-review-session-progress.handler"
import {
    ConfigurableModuleClass,
} from "./sync-flashcard-due-review-session-progress.module-definition"

@Module({
    imports: [
        CqrsModule,
    ],
    providers: [
        SyncFlashcardDueReviewSessionProgressResolver,
        SyncFlashcardDueReviewSessionProgressService,
        SyncFlashcardDueReviewSessionProgressHandler,
    ],
    exports: [
        SyncFlashcardDueReviewSessionProgressService,
    ],
})
export class SyncFlashcardDueReviewSessionProgressSingleMutationModule extends ConfigurableModuleClass {}
