import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-flashcard-review-session-by-session-id.module-definition"
import {
    MyFlashcardReviewSessionBySessionIdResolver,
} from "./my-flashcard-review-session-by-session-id.resolver"

@Module({
    providers: [
        MyFlashcardReviewSessionBySessionIdResolver,
    ],
})
export class MyFlashcardReviewSessionBySessionIdSingleQueryModule extends ConfigurableModuleClass {}
