import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-flashcard-quiz-history.module-definition"
import {
    MyFlashcardQuizHistoryResolver,
} from "./my-flashcard-quiz-history.resolver"
import {
    MyFlashcardQuizHistoryService,
} from "./my-flashcard-quiz-history.service"

@Module({
    providers: [
        MyFlashcardQuizHistoryResolver,
        MyFlashcardQuizHistoryService,
    ],
})
/** Feature-module boundary for the `myFlashcardQuizHistory` query — wires its resolver + service. */
export class MyFlashcardQuizHistorySingleQueryModule extends ConfigurableModuleClass {}
