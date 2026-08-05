import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-due-flashcards.module-definition"
import {
    MyDueFlashcardsResolver,
} from "./my-due-flashcards.resolver"

@Module({
    providers: [
        MyDueFlashcardsResolver,
    ],
})
/** Feature-module boundary for the `myDueFlashcards` query — wires its resolver (business logic lives in the shared `FlashcardReviewService`). */
export class MyDueFlashcardsSingleQueryModule extends ConfigurableModuleClass {}
