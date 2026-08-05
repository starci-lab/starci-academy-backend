import {
    Module,
} from "@nestjs/common"
import {
    CqrsModule,
} from "@nestjs/cqrs"
import {
    SyncFlashcardReviewSessionProgressResolver,
} from "./sync-flashcard-review-session-progress.resolver"
import {
    SyncFlashcardReviewSessionProgressService,
} from "./sync-flashcard-review-session-progress.service"
import {
    SyncFlashcardReviewSessionProgressHandler,
} from "./sync-flashcard-review-session-progress.handler"
import {
    ConfigurableModuleClass,
} from "./sync-flashcard-review-session-progress.module-definition"

@Module({
    imports: [
        CqrsModule,
    ],
    providers: [
        SyncFlashcardReviewSessionProgressResolver,
        SyncFlashcardReviewSessionProgressService,
        SyncFlashcardReviewSessionProgressHandler,
    ],
    exports: [
        SyncFlashcardReviewSessionProgressService,
    ],
})
/** Feature-module boundary for the `syncFlashcardReviewSessionProgress` mutation — wires its resolver + service + CQRS handler. */
export class SyncFlashcardReviewSessionProgressSingleMutationModule extends ConfigurableModuleClass {}
