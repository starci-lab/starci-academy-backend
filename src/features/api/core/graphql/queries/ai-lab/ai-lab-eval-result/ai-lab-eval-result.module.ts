import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./ai-lab-eval-result.module-definition"
import {
    AiLabEvalResultResolver,
} from "./ai-lab-eval-result.resolver"

@Module({
    providers: [
        AiLabEvalResultResolver,
    ],
})
export class AiLabEvalResultSingleQueryModule extends ConfigurableModuleClass {}
