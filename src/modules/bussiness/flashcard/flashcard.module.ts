import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./flashcard.module-definition"
import {
    FlashcardDeckReadService,
} from "./flashcard-deck.service"
import {
    FlashcardQuizSessionService,
} from "./flashcard-quiz-session.service"
import {
    FlashcardReviewService,
} from "./flashcard-review.service"
import {
    FlashcardReviewSessionService,
} from "./flashcard-review-session.service"

/**
 * Module for flashcard business logic (deck reads + spaced-repetition review).
 * `AiInvokeService` / `AiEntitlementService` come from the globally-registered
 * `AiModule`, so no explicit AI import is needed here — the unified credit pool
 * (gate + charge + history) is metered entirely through `AiEntitlementService`.
 */
@Module({
    providers: [
        FlashcardDeckReadService,
        FlashcardQuizSessionService,
        FlashcardReviewService,
        FlashcardReviewSessionService,
    ],
    exports: [
        FlashcardDeckReadService,
        FlashcardQuizSessionService,
        FlashcardReviewService,
        FlashcardReviewSessionService,
    ],
})
export class FlashcardModule extends ConfigurableModuleClass {
}
