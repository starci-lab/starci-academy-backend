import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./content-ai-sessions.module-definition"
import {
    ContentAiSessionsResolver,
} from "./content-ai-sessions.resolver"

@Module({
    providers: [
        ContentAiSessionsResolver,
    ],
})
/**
 * Nest DI for `contentAiSessions` -- registers the resolver that lists / searches
 * the caller's content-AI conversations.
 */
export class ContentAiSessionsSingleQueryModule extends ConfigurableModuleClass { }
