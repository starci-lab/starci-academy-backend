import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./system-health.module-definition"
import {
    SystemHealthGateway,
} from "./system-health.gateway"

@Module({
    providers: [
        SystemHealthGateway,
    ],
    exports: [
        SystemHealthGateway,
    ],
})
/**
 * Module providing the Socket.IO system-health gateway (public per-model AI
 * latency snapshot broadcast).
 */
export class SystemHealthModule extends ConfigurableModuleClass {}
