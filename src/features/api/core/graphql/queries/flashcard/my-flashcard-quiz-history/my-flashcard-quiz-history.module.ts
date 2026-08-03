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

/** Feature-module boundary for the `myFlashcardQuizHistory` query — wires its resolver + service. */
@Module({
    providers: [
        MyFlashcardQuizHistoryResolver,
        MyFlashcardQuizHistoryService,
    ],
})
export class MyFlashcardQuizHistorySingleQueryModule extends ConfigurableModuleClass {}
