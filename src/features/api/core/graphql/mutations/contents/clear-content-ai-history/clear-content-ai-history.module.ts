import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./clear-content-ai-history.module-definition"
import {
    ClearContentAiHistoryResolver,
} from "./clear-content-ai-history.resolver"

@Module({
    providers: [
        ClearContentAiHistoryResolver,
    ],
})
export class ClearContentAiHistorySingleMutationModule extends ConfigurableModuleClass { }
