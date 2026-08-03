import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./ai-lab.module-definition"
import {
    RunPlaygroundPromptSingleMutationModule,
} from "./run-playground-prompt"

/**
 * AI Lab mutation group: run a playground prompt.
 */
@Module({
    imports: [
        RunPlaygroundPromptSingleMutationModule.register({
            isGlobal: true,
        }),
    ],
})
export class AiLabMutationsModule extends ConfigurableModuleClass {}
