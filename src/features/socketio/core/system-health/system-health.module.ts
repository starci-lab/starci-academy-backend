import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./system-health.module-definition"
import {
    SystemHealthGateway,
} from "./system-health.gateway"

/**
 * Module providing the Socket.IO system-health gateway (public per-model AI
 * latency snapshot broadcast).
 */
@Module({
    providers: [
        SystemHealthGateway,
    ],
    exports: [
        SystemHealthGateway,
    ],
})
export class SystemHealthModule extends ConfigurableModuleClass {}
