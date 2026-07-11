import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./flashcard-cards-by-ids.module-definition"
import {
    FlashcardCardsByIdsResolver,
} from "./flashcard-cards-by-ids.resolver"

@Module({
    providers: [
        FlashcardCardsByIdsResolver,
    ],
})
export class FlashcardCardsByIdsSingleQueryModule extends ConfigurableModuleClass {}
