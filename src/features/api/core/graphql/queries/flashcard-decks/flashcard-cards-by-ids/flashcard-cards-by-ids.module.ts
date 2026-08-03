import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./flashcard-cards-by-ids.module-definition"
import {
    FlashcardCardsByIdsResolver,
} from "./flashcard-cards-by-ids.resolver"

/** Feature-module boundary for the `flashcardCardsByIds` query — wires its resolver (business logic lives in the shared `FlashcardReviewService`). */
@Module({
    providers: [
        FlashcardCardsByIdsResolver,
    ],
})
export class FlashcardCardsByIdsSingleQueryModule extends ConfigurableModuleClass {}
