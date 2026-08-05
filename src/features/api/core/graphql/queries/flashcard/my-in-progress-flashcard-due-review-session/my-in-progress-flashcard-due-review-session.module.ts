import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-in-progress-flashcard-due-review-session.module-definition"
import {
    MyInProgressFlashcardDueReviewSessionResolver,
} from "./my-in-progress-flashcard-due-review-session.resolver"

@Module({
    providers: [
        MyInProgressFlashcardDueReviewSessionResolver,
    ],
})
/** Feature-module boundary for the `myInProgressFlashcardDueReviewSession` query — wires its resolver (business logic lives in the shared `FlashcardDueReviewSessionService`). */
export class MyInProgressFlashcardDueReviewSessionSingleQueryModule extends ConfigurableModuleClass {}
