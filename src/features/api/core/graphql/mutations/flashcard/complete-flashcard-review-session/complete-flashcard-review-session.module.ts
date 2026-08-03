import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./complete-flashcard-review-session.module-definition"
import {
    CompleteFlashcardReviewSessionResolver,
} from "./complete-flashcard-review-session.resolver"

/** Feature-module boundary for the `completeFlashcardReviewSession` mutation — wires its resolver (business logic lives in the shared `FlashcardReviewSessionService`). */
@Module({
    providers: [
        CompleteFlashcardReviewSessionResolver,
    ],
})
export class CompleteFlashcardReviewSessionSingleMutationModule extends ConfigurableModuleClass {}
