import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./submit-quiz-test.module-definition"
import {
    SubmitQuizTestResolver,
} from "./submit-quiz-test.resolver"

@Module({
    providers: [
        SubmitQuizTestResolver,
    ],
})
export class SubmitQuizTestSingleMutationModule extends ConfigurableModuleClass {}
