import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-due-flashcards.module-definition"
import {
    MyDueFlashcardsResolver,
} from "./my-due-flashcards.resolver"

/** Feature-module boundary for the `myDueFlashcards` query — wires its resolver (business logic lives in the shared `FlashcardReviewService`). */
@Module({
    providers: [
        MyDueFlashcardsResolver,
    ],
})
export class MyDueFlashcardsSingleQueryModule extends ConfigurableModuleClass {}
