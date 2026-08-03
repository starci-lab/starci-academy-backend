import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-in-progress-flashcard-review-session.module-definition"
import {
    MyInProgressFlashcardReviewSessionResolver,
} from "./my-in-progress-flashcard-review-session.resolver"

/** Feature-module boundary for the `myInProgressFlashcardReviewSession` query — wires its resolver (business logic lives in the shared `FlashcardReviewSessionService`). */
@Module({
    providers: [
        MyInProgressFlashcardReviewSessionResolver,
    ],
})
export class MyInProgressFlashcardReviewSessionSingleQueryModule extends ConfigurableModuleClass {}
