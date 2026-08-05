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
/** Feature-module boundary for the `startFlashcardQuizSession` mutation -- wires its resolver + service + CQRS handler; exports the service so `myInProgressFlashcardQuizSession` can share its resolution logic. */
export class StartFlashcardQuizSessionSingleMutationModule extends ConfigurableModuleClass {}
