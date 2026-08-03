import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-flashcard-review-stats.module-definition"
import {
    MyFlashcardReviewStatsResolver,
} from "./my-flashcard-review-stats.resolver"
import {
    MyFlashcardReviewStatsService,
} from "./my-flashcard-review-stats.service"

/** Feature-module boundary for the `myFlashcardReviewStats` query — wires its resolver + service. */
@Module({
    providers: [
        MyFlashcardReviewStatsResolver,
        MyFlashcardReviewStatsService,
    ],
})
export class MyFlashcardReviewStatsSingleQueryModule extends ConfigurableModuleClass {}
