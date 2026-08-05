import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./flashcard.module-definition"
import {
    CompleteFlashcardQuizSessionSingleMutationModule,
} from "./complete-flashcard-quiz-session/complete-flashcard-quiz-session.module"
import {
    ReviewFlashcardSingleMutationModule,
} from "./review-flashcard/review-flashcard.module"
import {
    StartFlashcardQuizSessionSingleMutationModule,
} from "./start-flashcard-quiz-session/start-flashcard-quiz-session.module"
import {
    SyncFlashcardQuizSessionProgressSingleMutationModule,
} from "./sync-flashcard-quiz-session-progress/sync-flashcard-quiz-session-progress.module"
import {
    StartFlashcardReviewSessionSingleMutationModule,
} from "./start-flashcard-review-session/start-flashcard-review-session.module"
import {
    SyncFlashcardReviewSessionProgressSingleMutationModule,
} from "./sync-flashcard-review-session-progress/sync-flashcard-review-session-progress.module"
import {
    CompleteFlashcardReviewSessionSingleMutationModule,
} from "./complete-flashcard-review-session/complete-flashcard-review-session.module"
import {
    StartFlashcardDueReviewSessionSingleMutationModule,
} from "./start-flashcard-due-review-session/start-flashcard-due-review-session.module"
import {
    SyncFlashcardDueReviewSessionProgressSingleMutationModule,
} from "./sync-flashcard-due-review-session-progress/sync-flashcard-due-review-session-progress.module"
import {
    CompleteFlashcardDueReviewSessionSingleMutationModule,
} from "./complete-flashcard-due-review-session/complete-flashcard-due-review-session.module"

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
/**
 * Flashcard mutation group (spaced-repetition review grading + quick-quiz XP
 * + resumable quick-quiz session draw/sync + resumable review session
 * draw/sync + resumable cross-deck due-review batch session draw/sync).
 */
export class FlashcardMutationsModule extends ConfigurableModuleClass {}
