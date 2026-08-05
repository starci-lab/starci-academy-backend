import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./ai-model-latency.module-definition"
import {
    AiModelLatencyResolver,
} from "./ai-model-latency.resolver"

@Module({
    providers: [
        AiModelLatencyResolver,
    ],
})
/** Feature-module boundary for the public `aiModelLatency` query — wires its resolver. */
export class AiModelLatencySingleQueryModule extends ConfigurableModuleClass {}
