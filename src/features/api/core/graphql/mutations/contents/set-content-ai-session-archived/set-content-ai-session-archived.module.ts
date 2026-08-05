import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./set-content-ai-session-archived.module-definition"
import {
    SetContentAiSessionArchivedResolver,
} from "./set-content-ai-session-archived.resolver"

@Module({
    providers: [
        SetContentAiSessionArchivedResolver,
    ],
})
/** Isolated Nest registration for archive/unarchive without wiring sibling session mutations. */
export class SetContentAiSessionArchivedSingleMutationModule extends ConfigurableModuleClass { }
