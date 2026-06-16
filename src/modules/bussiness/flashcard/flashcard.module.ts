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
    InterviewGradePromptService,
} from "./interview-grade-prompt.service"
import {
    InterviewGradingService,
} from "./interview-grading.service"
import {
    FlashcardReviewService,
} from "./flashcard-review.service"
import {
    CreditModule,
} from "../credit"

/**
 * Module for interview-flashcard business logic (deck reads + stateless
 * AI grading of transcribed answers). Cards are open-ended Q&A: studied as flip
 * cards, and optionally graded against the card's model answer rubric.
 * `AiInvokeService` / `AiEntitlementService` come from the globally-registered
 * `AiModule`, so no explicit AI import is needed here. `CreditModule` is imported
 * so interview grading can meter the Auto credit pool (gate + charge).
 */
@Module({
    imports: [
        CreditModule,
    ],
    providers: [
        FlashcardDeckReadService,
        InterviewGradePromptService,
        InterviewGradingService,
        FlashcardReviewService,
    ],
    exports: [
        FlashcardDeckReadService,
        InterviewGradePromptService,
        InterviewGradingService,
        FlashcardReviewService,
    ],
})
export class FlashcardModule extends ConfigurableModuleClass {
}
