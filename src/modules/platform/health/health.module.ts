import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./health.module-definition"
import {
    SystemHealthService,
} from "./system-health.service"
import {
    PrometheusMetricsService,
} from "./prometheus-metrics.service"

/**
 * Provides the {@link SystemHealthService} liveness prober and the
 * {@link PrometheusMetricsService} resource-usage reader. Register with
 * `.register({ isGlobal: true })` so any feature (e.g. the public
 * `systemHealthStatus` query) can inject either without re-importing the
 * module.
 */
@Module({
    providers: [SystemHealthService, PrometheusMetricsService],
    exports: [SystemHealthService, PrometheusMetricsService],
})
export class HealthModule extends ConfigurableModuleClass {}
