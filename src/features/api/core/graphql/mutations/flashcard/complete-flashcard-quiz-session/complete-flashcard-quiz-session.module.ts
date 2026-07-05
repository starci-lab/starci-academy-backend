import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./complete-flashcard-quiz-session.module-definition"
import {
    CompleteFlashcardQuizSessionResolver,
} from "./complete-flashcard-quiz-session.resolver"

@Module({
    providers: [
        CompleteFlashcardQuizSessionResolver,
    ],
})
export class CompleteFlashcardQuizSessionSingleMutationModule extends ConfigurableModuleClass {}
