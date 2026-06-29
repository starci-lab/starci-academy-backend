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
export class SetAiCeilSingleMutationModule extends ConfigurableModuleClass { }
