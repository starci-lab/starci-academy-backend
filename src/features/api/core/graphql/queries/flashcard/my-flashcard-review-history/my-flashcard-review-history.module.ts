import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-flashcard-review-history.module-definition"
import {
    MyFlashcardReviewHistoryResolver,
} from "./my-flashcard-review-history.resolver"
import {
    MyFlashcardReviewHistoryService,
} from "./my-flashcard-review-history.service"

@Module({
    providers: [
        MyFlashcardReviewHistoryResolver,
        MyFlashcardReviewHistoryService,
    ],
})
/** Feature-module boundary for the `myFlashcardReviewHistory` query -- wires its resolver + service. */
export class MyFlashcardReviewHistorySingleQueryModule extends ConfigurableModuleClass {}
