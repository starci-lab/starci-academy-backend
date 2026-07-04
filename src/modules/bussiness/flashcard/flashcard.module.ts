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
    FlashcardReviewService,
} from "./flashcard-review.service"

/**
 * Module for flashcard business logic (deck reads + spaced-repetition review).
 * `AiInvokeService` / `AiEntitlementService` come from the globally-registered
 * `AiModule`, so no explicit AI import is needed here — the unified credit pool
 * (gate + charge + history) is metered entirely through `AiEntitlementService`.
 */
@Module({
    providers: [
        FlashcardDeckReadService,
        FlashcardReviewService,
    ],
    exports: [
        FlashcardDeckReadService,
        FlashcardReviewService,
    ],
})
export class FlashcardModule extends ConfigurableModuleClass {
}
