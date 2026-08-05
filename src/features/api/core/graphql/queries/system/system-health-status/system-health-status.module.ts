import {
    Module,
} from "@nestjs/common"
import {
    HealthModule,
} from "@modules/health"
import {
    ConfigurableModuleClass,
} from "./system-health-status.module-definition"
import {
    SystemHealthStatusResolver,
} from "./system-health-status.resolver"

@Module({
    imports: [
        HealthModule.register({
            isGlobal: true,
        }),
    ],
    providers: [
        SystemHealthStatusResolver,
    ],
})
/**
 * Feature-module boundary for the public `systemHealthStatus` query — imports
 * `HealthModule` and wires its resolver.
 */
export class SystemHealthStatusSingleQueryModule extends ConfigurableModuleClass {}
