import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./run-playground-prompt.module-definition"
import {
    RunPlaygroundPromptResolver,
} from "./run-playground-prompt.resolver"
import {
    RunPlaygroundPromptService,
} from "./run-playground-prompt.service"

@Module({
    providers: [
        RunPlaygroundPromptResolver,
        RunPlaygroundPromptService,
    ],
})
export class RunPlaygroundPromptSingleMutationModule extends ConfigurableModuleClass {}
