import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./system.module-definition"
import {
    SystemConfigSingleQueryModule,
} from "./system-config/system-config.module"
import {
    AiModelsSingleQueryModule,
} from "./ai-models/ai-models.module"
import {
    AiBalancerHealthSingleQueryModule,
} from "./ai-balancer-health/ai-balancer-health.module"
import {
    AiKeyHealthSingleQueryModule,
} from "./ai-key-health/ai-key-health.module"
import {
    PlatformStatsSingleQueryModule,
} from "./platform-stats/platform-stats.module"
import {
    MyGithubTeamStatusSingleQueryModule,
} from "./my-github-team-status/my-github-team-status.module"
import {
    SystemHealthStatusSingleQueryModule,
} from "./system-health-status/system-health-status.module"
import {
    AiModelLatencySingleQueryModule,
} from "./ai-model-latency/ai-model-latency.module"

@Module({
    imports: [
        SystemConfigSingleQueryModule.register({
            isGlobal: true,
        }),
        MyGithubTeamStatusSingleQueryModule.register({
            isGlobal: true,
        }),
        AiModelsSingleQueryModule.register({
            isGlobal: true,
        }),
        AiBalancerHealthSingleQueryModule.register({
            isGlobal: true,
        }),
        AiKeyHealthSingleQueryModule.register({
            isGlobal: true,
        }),
        PlatformStatsSingleQueryModule.register({
            isGlobal: true,
        }),
        SystemHealthStatusSingleQueryModule.register({
            isGlobal: true,
        }),
        AiModelLatencySingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
/**
 * System query group -- config, AI roster/health, platform counters, GitHub team
 * status, and public infrastructure probes. Registered global so each leaf
 * resolver is picked up by the schema.
 */
export class SystemModule extends ConfigurableModuleClass {}
