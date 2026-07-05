import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./flashcard.module-definition"
import {
    CompleteFlashcardQuizSessionSingleMutationModule,
} from "./complete-flashcard-quiz-session"
import {
    ReviewFlashcardSingleMutationModule,
} from "./review-flashcard"

/**
 * Flashcard mutation group (spaced-repetition review grading + quick-quiz XP).
 */
@Module({
    imports: [
        ReviewFlashcardSingleMutationModule.register({
            isGlobal: true,
        }),
        CompleteFlashcardQuizSessionSingleMutationModule.register({
            isGlobal: true,
        }),
    ],
})
export class FlashcardMutationsModule extends ConfigurableModuleClass {}
