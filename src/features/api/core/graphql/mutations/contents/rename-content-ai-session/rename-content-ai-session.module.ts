import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./rename-content-ai-session.module-definition"
import {
    RenameContentAiSessionResolver,
} from "./rename-content-ai-session.resolver"

@Module({
    providers: [
        RenameContentAiSessionResolver,
    ],
})
/** Isolated Nest registration for renaming a conversation without wiring sibling session mutations. */
export class RenameContentAiSessionSingleMutationModule extends ConfigurableModuleClass { }
