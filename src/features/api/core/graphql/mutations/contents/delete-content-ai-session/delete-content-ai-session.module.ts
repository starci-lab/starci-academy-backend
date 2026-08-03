import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./delete-content-ai-session.module-definition"
import {
    DeleteContentAiSessionResolver,
} from "./delete-content-ai-session.resolver"

@Module({
    providers: [
        DeleteContentAiSessionResolver,
    ],
})
export class DeleteContentAiSessionSingleMutationModule extends ConfigurableModuleClass { }
