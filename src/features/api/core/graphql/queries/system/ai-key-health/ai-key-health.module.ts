import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./ai-key-health.module-definition"
import {
    AiKeyHealthResolver,
} from "./ai-key-health.resolver"

@Module({
    providers: [
        AiKeyHealthResolver,
    ],
})
export class AiKeyHealthSingleQueryModule extends ConfigurableModuleClass {}
