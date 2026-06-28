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
export class ContentAiSessionsSingleQueryModule extends ConfigurableModuleClass { }
