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
export class RenameContentAiSessionSingleMutationModule extends ConfigurableModuleClass { }
