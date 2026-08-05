import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./set-ai-ceil.module-definition"
import {
    SetAiCeilResolver,
} from "./set-ai-ceil.resolver"

@Module({
    providers: [
        SetAiCeilResolver,
    ],
})
/**
 * Registers the setAiCeil resolver so the AI group can mount the ceiling
 * write without importing the resolver class itself.
 */
export class SetAiCeilSingleMutationModule extends ConfigurableModuleClass { }
