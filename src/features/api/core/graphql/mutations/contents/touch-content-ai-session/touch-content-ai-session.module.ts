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
/** Isolated Nest registration for bumping conversation recency without wiring sibling session mutations. */
export class TouchContentAiSessionSingleMutationModule extends ConfigurableModuleClass { }
