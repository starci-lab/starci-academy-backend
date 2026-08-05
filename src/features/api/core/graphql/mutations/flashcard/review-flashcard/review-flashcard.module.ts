import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./review-flashcard.module-definition"
import {
    ReviewFlashcardResolver,
} from "./review-flashcard.resolver"

@Module({
    providers: [
        ReviewFlashcardResolver,
    ],
})
/** Feature-module boundary for the `reviewFlashcard` mutation — wires its resolver (business logic lives in the shared `FlashcardReviewService`). */
export class ReviewFlashcardSingleMutationModule extends ConfigurableModuleClass {}
