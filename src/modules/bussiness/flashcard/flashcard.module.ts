import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./flashcard.module-definition"
import {
    FlashcardDeckReadService,
} from "./flashcard-deck.service"

/**
 * Module for interview-flashcard business logic (deck reads). Cards are
 * open-ended Q&A reviewed as flip cards — no server-side grading.
 */
@Module({
    providers: [
        FlashcardDeckReadService,
    ],
    exports: [
        FlashcardDeckReadService,
    ],
})
export class FlashcardModule extends ConfigurableModuleClass {
}
