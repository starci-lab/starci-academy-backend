import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-in-progress-flashcard-review-session.module-definition"
import {
    MyInProgressFlashcardReviewSessionResolver,
} from "./my-in-progress-flashcard-review-session.resolver"

@Module({
    providers: [
        MyInProgressFlashcardReviewSessionResolver,
    ],
})
export class MyInProgressFlashcardReviewSessionSingleQueryModule extends ConfigurableModuleClass {}
