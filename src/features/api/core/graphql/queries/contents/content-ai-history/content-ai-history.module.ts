import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./content-ai-history.module-definition"
import {
    ContentAiHistoryResolver,
} from "./content-ai-history.resolver"

@Module({
    providers: [
        ContentAiHistoryResolver,
    ],
})
export class ContentAiHistorySingleQueryModule extends ConfigurableModuleClass { }
