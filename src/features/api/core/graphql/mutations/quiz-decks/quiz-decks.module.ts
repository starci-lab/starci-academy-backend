import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./quiz-decks.module-definition"
import {
    SubmitQuizTestSingleMutationModule,
} from "./submit-quiz-test"

/**
 * Quiz-deck mutation group (grade a Test submission).
 */
@Module({
    imports: [
        SubmitQuizTestSingleMutationModule.register({
            isGlobal: true,
        }),
    ],
})
export class QuizDecksMutationsModule extends ConfigurableModuleClass {}
