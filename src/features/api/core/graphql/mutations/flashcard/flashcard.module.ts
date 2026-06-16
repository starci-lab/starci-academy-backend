import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./flashcard.module-definition"
import {
    ReviewFlashcardSingleMutationModule,
} from "./review-flashcard"

/**
 * Flashcard mutation group (spaced-repetition review grading).
 */
@Module({
    imports: [
        ReviewFlashcardSingleMutationModule.register({
            isGlobal: true,
        }),
    ],
})
export class FlashcardMutationsModule extends ConfigurableModuleClass {}
