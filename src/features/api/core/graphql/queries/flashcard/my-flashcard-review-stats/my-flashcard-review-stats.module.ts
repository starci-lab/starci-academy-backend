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

@Module({
    providers: [
        MyFlashcardReviewStatsResolver,
        MyFlashcardReviewStatsService,
    ],
})
/** Feature-module boundary for the `myFlashcardReviewStats` query — wires its resolver + service. */
export class MyFlashcardReviewStatsSingleQueryModule extends ConfigurableModuleClass {}
