import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-flashcard-review-session-stats-by-session-id.module-definition"
import {
    MyFlashcardReviewSessionStatsBySessionIdResolver,
} from "./my-flashcard-review-session-stats-by-session-id.resolver"
import {
    MyFlashcardReviewSessionStatsBySessionIdService,
} from "./my-flashcard-review-session-stats-by-session-id.service"

@Module({
    providers: [
        MyFlashcardReviewSessionStatsBySessionIdResolver,
        MyFlashcardReviewSessionStatsBySessionIdService,
    ],
})
/** Feature-module boundary for the `myFlashcardReviewSessionStatsBySessionId` query -- wires its resolver + service. */
export class MyFlashcardReviewSessionStatsBySessionIdSingleQueryModule extends ConfigurableModuleClass {}
