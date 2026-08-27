import {
    Module
} from "@nestjs/common"
import {
    ConfigurableModuleClass
} from "./flashcard-quiz-eligibility.module-definition"
import {
    FlashcardQuizEligibilityResolver
} from "./flashcard-quiz-eligibility.resolver"
import {
    FlashcardQuizEligibilityService
} from "./flashcard-quiz-eligibility.service"

@Module({
    providers: [FlashcardQuizEligibilityResolver,
        FlashcardQuizEligibilityService]
})
/** Feature boundary for the additive flashcardQuizEligibility query. */
export class FlashcardQuizEligibilitySingleQueryModule extends ConfigurableModuleClass {}
