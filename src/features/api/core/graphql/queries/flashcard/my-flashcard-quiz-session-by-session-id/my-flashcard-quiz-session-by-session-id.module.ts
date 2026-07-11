import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-flashcard-quiz-session-by-session-id.module-definition"
import {
    MyFlashcardQuizSessionBySessionIdResolver,
} from "./my-flashcard-quiz-session-by-session-id.resolver"
import {
    MyFlashcardQuizSessionBySessionIdService,
} from "./my-flashcard-quiz-session-by-session-id.service"

@Module({
    providers: [
        MyFlashcardQuizSessionBySessionIdResolver,
        MyFlashcardQuizSessionBySessionIdService,
    ],
})
export class MyFlashcardQuizSessionBySessionIdSingleQueryModule extends ConfigurableModuleClass {}
