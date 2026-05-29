import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./quiz.module-definition"
import {
    QuizTestGradingService,
} from "./quiz-test-grading.service"
import {
    QuizDeckReadService,
} from "./quiz-deck.service"

/**
 * Module for Quizlet-style multiple-choice quiz business logic (deck reads +
 * Test-mode grading).
 */
@Module({
    providers: [
        QuizTestGradingService,
        QuizDeckReadService,
    ],
    exports: [
        QuizTestGradingService,
        QuizDeckReadService,
    ],
})
export class QuizModule extends ConfigurableModuleClass {
}
