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
export class MyInProgressFlashcardDueReviewSessionSingleQueryModule extends ConfigurableModuleClass {}
