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
/**
 * Nest DI for `contentAiSessionMessages` -- registers the resolver that reads
 * saved content-AI turns for the authenticated user.
 */
export class ContentAiHistorySingleQueryModule extends ConfigurableModuleClass { }
