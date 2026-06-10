import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./quiz.module-definition"
import {
    QuizDeckReadService,
} from "./quiz-deck.service"

/**
 * Module for interview-flashcard business logic (deck reads). Cards are
 * open-ended Q&A reviewed as flip cards — no server-side grading.
 */
@Module({
    providers: [
        QuizDeckReadService,
    ],
    exports: [
        QuizDeckReadService,
    ],
})
export class QuizModule extends ConfigurableModuleClass {
}
