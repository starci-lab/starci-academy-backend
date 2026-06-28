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
    ],
})
export class SystemModule extends ConfigurableModuleClass {}
