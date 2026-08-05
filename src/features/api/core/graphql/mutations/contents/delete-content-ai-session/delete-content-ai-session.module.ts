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
/** Isolated Nest registration for deleting a content-AI conversation without wiring sibling session mutations. */
export class DeleteContentAiSessionSingleMutationModule extends ConfigurableModuleClass { }
