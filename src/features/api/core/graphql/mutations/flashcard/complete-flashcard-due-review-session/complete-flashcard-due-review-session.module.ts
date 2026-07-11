import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./complete-flashcard-due-review-session.module-definition"
import {
    CompleteFlashcardDueReviewSessionResolver,
} from "./complete-flashcard-due-review-session.resolver"

@Module({
    providers: [
        CompleteFlashcardDueReviewSessionResolver,
    ],
})
export class CompleteFlashcardDueReviewSessionSingleMutationModule extends ConfigurableModuleClass {}
