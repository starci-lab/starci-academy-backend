import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./complete-flashcard-quiz-session.module-definition"
import {
    CompleteFlashcardQuizSessionResolver,
} from "./complete-flashcard-quiz-session.resolver"

/** Feature-module boundary for the `completeFlashcardQuizSession` mutation — wires its resolver (business logic lives in the shared `FlashcardQuizSessionService`). */
@Module({
    providers: [
        CompleteFlashcardQuizSessionResolver,
    ],
})
export class CompleteFlashcardQuizSessionSingleMutationModule extends ConfigurableModuleClass {}
