import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./ai-lab.module-definition"
import {
    RunPlaygroundPromptSingleMutationModule,
} from "./run-playground-prompt"
import {
    SubmitEvalChallengeSingleMutationModule,
} from "./submit-eval-challenge"

/**
 * AI Lab mutation group: run a playground prompt and submit a prompt template
 * for eval grading.
 */
@Module({
    imports: [
        RunPlaygroundPromptSingleMutationModule.register({
            isGlobal: true,
        }),
        SubmitEvalChallengeSingleMutationModule.register({
            isGlobal: true,
        }),
    ],
})
export class AiLabMutationsModule extends ConfigurableModuleClass {}
