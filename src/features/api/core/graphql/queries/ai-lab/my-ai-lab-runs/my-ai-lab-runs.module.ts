import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-ai-lab-runs.module-definition"
import {
    MyAiLabRunsResolver,
} from "./my-ai-lab-runs.resolver"

@Module({
    providers: [
        MyAiLabRunsResolver,
    ],
})
export class MyAiLabRunsSingleQueryModule extends ConfigurableModuleClass {}
