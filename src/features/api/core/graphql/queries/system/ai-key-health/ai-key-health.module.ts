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
/** Feature-module boundary for the public `aiKeyHealth` query — wires its resolver. */
export class AiKeyHealthSingleQueryModule extends ConfigurableModuleClass {}
