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
/** Isolated Nest registration for starting a content-AI conversation without wiring sibling session mutations. */
export class CreateContentAiSessionSingleMutationModule extends ConfigurableModuleClass { }
