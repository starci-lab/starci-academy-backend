import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./complete-flashcard-review-session.module-definition"
import {
    CompleteFlashcardReviewSessionResolver,
} from "./complete-flashcard-review-session.resolver"

@Module({
    providers: [
        CompleteFlashcardReviewSessionResolver,
    ],
})
export class CompleteFlashcardReviewSessionSingleMutationModule extends ConfigurableModuleClass {}
