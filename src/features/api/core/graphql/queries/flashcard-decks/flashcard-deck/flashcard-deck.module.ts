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
export class FlashcardDeckSingleQueryModule extends ConfigurableModuleClass {}
