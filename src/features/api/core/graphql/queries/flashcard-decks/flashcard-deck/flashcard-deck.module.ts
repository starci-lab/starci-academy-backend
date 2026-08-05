import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./flashcard-deck.module-definition"
import {
    FlashcardDeckResolver,
} from "./flashcard-deck.resolver"

@Module({
    providers: [
        FlashcardDeckResolver,
    ],
})
/** Feature-module boundary for the `flashcardDeck` query — wires its resolver (business logic lives in the shared `FlashcardDeckReadService`). */
export class FlashcardDeckSingleQueryModule extends ConfigurableModuleClass {}
