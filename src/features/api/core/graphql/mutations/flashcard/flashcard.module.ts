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
import {
    StartFlashcardQuizSessionSingleMutationModule,
} from "./start-flashcard-quiz-session"
import {
    SyncFlashcardQuizSessionProgressSingleMutationModule,
} from "./sync-flashcard-quiz-session-progress"

/**
 * Flashcard mutation group (spaced-repetition review grading + quick-quiz XP
 * + resumable quick-quiz session draw/sync).
 */
@Module({
    imports: [
        ReviewFlashcardSingleMutationModule.register({
            isGlobal: true,
        }),
        CompleteFlashcardQuizSessionSingleMutationModule.register({
            isGlobal: true,
        }),
        StartFlashcardQuizSessionSingleMutationModule.register({
            isGlobal: true,
        }),
        SyncFlashcardQuizSessionProgressSingleMutationModule.register({
            isGlobal: true,
        }),
    ],
})
export class FlashcardMutationsModule extends ConfigurableModuleClass {}
