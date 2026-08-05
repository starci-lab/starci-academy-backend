import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-in-progress-flashcard-quiz-session.module-definition"
import {
    MyInProgressFlashcardQuizSessionResolver,
} from "./my-in-progress-flashcard-quiz-session.resolver"
import {
    MyInProgressFlashcardQuizSessionService,
} from "./my-in-progress-flashcard-quiz-session.service"

@Module({
    providers: [
        MyInProgressFlashcardQuizSessionResolver,
        MyInProgressFlashcardQuizSessionService,
    ],
})
/** Feature-module boundary for the `myInProgressFlashcardQuizSession` query -- wires its resolver + service. */
export class MyInProgressFlashcardQuizSessionSingleQueryModule extends ConfigurableModuleClass {}
