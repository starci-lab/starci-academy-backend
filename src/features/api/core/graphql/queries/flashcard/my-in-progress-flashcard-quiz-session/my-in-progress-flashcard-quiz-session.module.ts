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
export class MyInProgressFlashcardQuizSessionSingleQueryModule extends ConfigurableModuleClass {}
