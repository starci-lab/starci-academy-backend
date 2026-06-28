import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./touch-content-ai-session.module-definition"
import {
    TouchContentAiSessionResolver,
} from "./touch-content-ai-session.resolver"

@Module({
    providers: [
        TouchContentAiSessionResolver,
    ],
})
export class TouchContentAiSessionSingleMutationModule extends ConfigurableModuleClass { }
