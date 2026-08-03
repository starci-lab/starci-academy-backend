import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./flashcard-deck.module-definition"
import {
    FlashcardDeckResolver,
} from "./flashcard-deck.resolver"

/** Feature-module boundary for the `flashcardDeck` query — wires its resolver (business logic lives in the shared `FlashcardDeckReadService`). */
@Module({
    providers: [
        FlashcardDeckResolver,
    ],
})
export class FlashcardDeckSingleQueryModule extends ConfigurableModuleClass {}
