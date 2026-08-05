import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./user-flashcard-course-stats-projection.module-definition"
import {
    UserFlashcardCourseStatsProjectionService,
} from "./user-flashcard-course-stats-projection.service"
import {
    UserFlashcardCourseStatsProjectionListener,
} from "./user-flashcard-course-stats-projection.listener"

@Module({
    providers: [
        UserFlashcardCourseStatsProjectionService,
        UserFlashcardCourseStatsProjectionListener,
    ],
    exports: [
        UserFlashcardCourseStatsProjectionService,
    ],
})
/**
 * Leaf module for the per-enrollment flashcard-course-stats projection
 * (recompute service + CDC listener on `flashcard_quiz_sessions` +
 * `flashcard_review_sessions`). Exports the service so `myFlashcardQuizStats`
 * / `myFlashcardReviewStats` can read it.
 */
export class UserFlashcardCourseStatsProjectionModule extends ConfigurableModuleClass {
}
