import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./contents.module-definition"
import {
    ContentsSingleQueryModule,
} from "./contents/contents.module"
import {
    ContentSingleQueryModule,
} from "./content/content.module"
import {
    ContentStatusSingleQueryModule,
} from "./content-status/content-status.module"
import {
    PublicContentSingleQueryModule,
} from "./public-content/public-content.module"
import {
    SavedContentsSingleQueryModule,
} from "./saved-contents/saved-contents.module"
import {
    SandboxRepoUrlModule,
} from "./sandbox-repo-url/sandbox-repo-url.module"
import {
    ContentSuggestionsSingleQueryModule,
} from "./content-suggestions/content-suggestions.module"
import {
    ContentAiHistorySingleQueryModule,
} from "./content-ai-history/content-ai-history.module"
import {
    ContentAiSessionsSingleQueryModule,
} from "./content-ai-sessions/content-ai-sessions.module"

@Module({
    imports: [
        ContentsSingleQueryModule.register({
            isGlobal: true,
        }),
        ContentSuggestionsSingleQueryModule.register({
            isGlobal: true,
        }),
        ContentSingleQueryModule.register({
            isGlobal: true,
        }),
        ContentStatusSingleQueryModule.register({
            isGlobal: true,
        }),
        PublicContentSingleQueryModule.register({
            isGlobal: true,
        }),
        SavedContentsSingleQueryModule.register({
            isGlobal: true,
        }),
        SandboxRepoUrlModule.register({
            isGlobal: true,
        }),
        ContentAiHistorySingleQueryModule.register({
            isGlobal: true,
        }),
        ContentAiSessionsSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
/**
 * Aggregates every content-domain query module (list, single, status, public,
 * saved, sandbox URL, suggestions, content-AI) as global Nest imports.
 */
export class ContentsModule extends ConfigurableModuleClass {}
