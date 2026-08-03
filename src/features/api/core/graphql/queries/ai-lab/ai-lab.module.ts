import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./ai-lab.module-definition"
import {
    AiLabPlaygroundSingleQueryModule,
} from "./ai-lab-playground"
import {
    MyAiLabRunsSingleQueryModule,
} from "./my-ai-lab-runs"

/**
 * AI Lab query group: lesson playground config and the learner's own run history.
 */
@Module({
    imports: [
        AiLabPlaygroundSingleQueryModule.register({
            isGlobal: true,
        }),
        MyAiLabRunsSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
export class AiLabQueriesModule extends ConfigurableModuleClass {}
