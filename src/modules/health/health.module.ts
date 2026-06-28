import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./health.module-definition"
import {
    SystemHealthService,
} from "./system-health.service"

/**
 * Provides the {@link SystemHealthService} liveness prober. Register with
 * `.register({ isGlobal: true })` so any feature (e.g. the public
 * `systemHealthStatus` query) can inject the service without re-importing the
 * module.
 */
@Module({
    providers: [SystemHealthService],
    exports: [SystemHealthService],
})
export class HealthModule extends ConfigurableModuleClass {}
