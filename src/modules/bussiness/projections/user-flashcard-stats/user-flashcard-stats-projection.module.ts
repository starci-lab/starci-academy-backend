import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./user-flashcard-stats-projection.module-definition"
import {
    UserFlashcardStatsProjectionService,
} from "./user-flashcard-stats-projection.service"
import {
    UserFlashcardStatsProjectionListener,
} from "./user-flashcard-stats-projection.listener"

@Module({
    providers: [
        UserFlashcardStatsProjectionService,
        UserFlashcardStatsProjectionListener,
    ],
    exports: [
        UserFlashcardStatsProjectionService,
    ],
})
/**
 * Leaf module for the per-user flashcard-stats projection (recompute service +
 * CDC listener on `flashcard_review_events`). Exports the service so the
 * `myFlashcardStats` read can use it.
 */
export class UserFlashcardStatsProjectionModule extends ConfigurableModuleClass {
}
