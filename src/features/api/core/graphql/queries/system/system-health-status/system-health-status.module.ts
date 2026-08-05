import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./system-health-status.module-definition"
import {
    SystemHealthStatusResolver,
} from "./system-health-status.resolver"

@Module({
    providers: [
        SystemHealthStatusResolver,
    ],
})
/**
 * Feature-module boundary for the public `systemHealthStatus` query -- wires its
 * resolver. `SystemHealthService` arrives from the global `HealthModule`
 * registration at the app root (naming-and-structure §8).
 */
export class SystemHealthStatusSingleQueryModule extends ConfigurableModuleClass {}
