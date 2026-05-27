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

@Module({
    imports: [
        SystemConfigSingleQueryModule.register({
            isGlobal: true,
        }),
        AiModelsSingleQueryModule.register({
            isGlobal: true,
        }),
        AiBalancerHealthSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
export class SystemModule extends ConfigurableModuleClass {}
