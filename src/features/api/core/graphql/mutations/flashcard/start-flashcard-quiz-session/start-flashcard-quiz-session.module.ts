import {
    Module,
} from "@nestjs/common"
import {
    CqrsModule,
} from "@nestjs/cqrs"
import {
    StartFlashcardQuizSessionResolver,
} from "./start-flashcard-quiz-session.resolver"
import {
    StartFlashcardQuizSessionService,
} from "./start-flashcard-quiz-session.service"
import {
    StartFlashcardQuizSessionHandler,
} from "./start-flashcard-quiz-session.handler"
import {
    ConfigurableModuleClass,
} from "./start-flashcard-quiz-session.module-definition"

@Module({
    imports: [
        CqrsModule,
    ],
    providers: [
        StartFlashcardQuizSessionResolver,
        StartFlashcardQuizSessionService,
        StartFlashcardQuizSessionHandler,
    ],
    exports: [
        StartFlashcardQuizSessionService,
    ],
})
export class StartFlashcardQuizSessionSingleMutationModule extends ConfigurableModuleClass {}
