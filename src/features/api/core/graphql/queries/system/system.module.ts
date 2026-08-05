import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./system.module-definition"
import {
    SystemConfigSingleQueryModule,
} from "./system-config"
import {
    AiModelsSingleQueryModule,
} from "./ai-models"
import {
    AiBalancerHealthSingleQueryModule,
} from "./ai-balancer-health"
import {
    AiKeyHealthSingleQueryModule,
} from "./ai-key-health"
import {
    PlatformStatsSingleQueryModule,
} from "./platform-stats"
import {
    MyGithubTeamStatusSingleQueryModule,
} from "./my-github-team-status"
import {
    SystemHealthStatusSingleQueryModule,
} from "./system-health-status"
import {
    AiModelLatencySingleQueryModule,
} from "./ai-model-latency"

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
 * System query group — config, AI roster/health, platform counters, GitHub team
 * status, and public infrastructure probes. Registered global so each leaf
 * resolver is picked up by the schema.
 */
export class SystemModule extends ConfigurableModuleClass {}
