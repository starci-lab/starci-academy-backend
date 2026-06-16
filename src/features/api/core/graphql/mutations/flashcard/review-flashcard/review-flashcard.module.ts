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
export class ReviewFlashcardSingleMutationModule extends ConfigurableModuleClass {}
