import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./ai-balancer-health.module-definition"
import {
    AiBalancerHealthResolver,
} from "./ai-balancer-health.resolver"

@Module({
    providers: [
        AiBalancerHealthResolver,
    ],
})
export class AiBalancerHealthSingleQueryModule extends ConfigurableModuleClass {}
