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
export class MyDueFlashcardsSingleQueryModule extends ConfigurableModuleClass {}
