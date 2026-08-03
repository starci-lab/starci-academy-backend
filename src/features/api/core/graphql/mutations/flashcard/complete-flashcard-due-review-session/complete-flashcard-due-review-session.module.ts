import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./complete-flashcard-due-review-session.module-definition"
import {
    CompleteFlashcardDueReviewSessionResolver,
} from "./complete-flashcard-due-review-session.resolver"

/** Feature-module boundary for the `completeFlashcardDueReviewSession` mutation — wires its resolver (business logic lives in the shared `FlashcardDueReviewSessionService`). */
@Module({
    providers: [
        CompleteFlashcardDueReviewSessionResolver,
    ],
})
export class CompleteFlashcardDueReviewSessionSingleMutationModule extends ConfigurableModuleClass {}
