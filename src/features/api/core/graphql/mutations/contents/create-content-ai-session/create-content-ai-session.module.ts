import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./create-content-ai-session.module-definition"
import {
    CreateContentAiSessionResolver,
} from "./create-content-ai-session.resolver"

@Module({
    providers: [
        CreateContentAiSessionResolver,
    ],
})
export class CreateContentAiSessionSingleMutationModule extends ConfigurableModuleClass { }
