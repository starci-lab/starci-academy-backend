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
import {
    StartFlashcardReviewSessionSingleMutationModule,
} from "./start-flashcard-review-session"
import {
    SyncFlashcardReviewSessionProgressSingleMutationModule,
} from "./sync-flashcard-review-session-progress"
import {
    CompleteFlashcardReviewSessionSingleMutationModule,
} from "./complete-flashcard-review-session"
import {
    StartFlashcardDueReviewSessionSingleMutationModule,
} from "./start-flashcard-due-review-session"
import {
    SyncFlashcardDueReviewSessionProgressSingleMutationModule,
} from "./sync-flashcard-due-review-session-progress"
import {
    CompleteFlashcardDueReviewSessionSingleMutationModule,
} from "./complete-flashcard-due-review-session"

/**
 * Flashcard mutation group (spaced-repetition review grading + quick-quiz XP
 * + resumable quick-quiz session draw/sync + resumable review session
 * draw/sync + resumable cross-deck due-review batch session draw/sync).
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
        StartFlashcardReviewSessionSingleMutationModule.register({
            isGlobal: true,
        }),
        SyncFlashcardReviewSessionProgressSingleMutationModule.register({
            isGlobal: true,
        }),
        CompleteFlashcardReviewSessionSingleMutationModule.register({
            isGlobal: true,
        }),
        StartFlashcardDueReviewSessionSingleMutationModule.register({
            isGlobal: true,
        }),
        SyncFlashcardDueReviewSessionProgressSingleMutationModule.register({
            isGlobal: true,
        }),
        CompleteFlashcardDueReviewSessionSingleMutationModule.register({
            isGlobal: true,
        }),
    ],
})
export class FlashcardMutationsModule extends ConfigurableModuleClass {}
