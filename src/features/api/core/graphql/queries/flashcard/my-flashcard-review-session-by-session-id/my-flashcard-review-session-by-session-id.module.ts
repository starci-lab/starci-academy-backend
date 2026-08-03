import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-flashcard-review-session-by-session-id.module-definition"
import {
    MyFlashcardReviewSessionBySessionIdResolver,
} from "./my-flashcard-review-session-by-session-id.resolver"

/** Feature-module boundary for the `myFlashcardReviewSessionBySessionId` query — wires its resolver (business logic lives in the shared `FlashcardReviewSessionService`). */
@Module({
    providers: [
        MyFlashcardReviewSessionBySessionIdResolver,
    ],
})
export class MyFlashcardReviewSessionBySessionIdSingleQueryModule extends ConfigurableModuleClass {}
