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

/**
 * Module for interview-flashcard business logic (deck reads + stateless
 * AI grading of transcribed answers). Cards are open-ended Q&A: studied as flip
 * cards, and optionally graded against the card's model answer rubric.
 * `AiInvokeService` / `AiEntitlementService` come from the globally-registered
 * `AiModule`, so no explicit AI import is needed here.
 */
@Module({
    providers: [
        FlashcardDeckReadService,
        InterviewGradePromptService,
        InterviewGradingService,
    ],
    exports: [
        FlashcardDeckReadService,
        InterviewGradePromptService,
        InterviewGradingService,
    ],
})
export class FlashcardModule extends ConfigurableModuleClass {
}
