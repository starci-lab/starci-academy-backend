import {
    Module,
} from "@nestjs/common"
import {
    AiPingModule,
    AiModelLatencyService,
} from "./ping"
import {
    AiInvokeService,
} from "./ai-invoke.service"
import {
    AiEntitlementService,
} from "./ai-entitlement.service"
import {
    GradingLaneValidationService,
} from "./grading-lane-validation.service"
import {
    AiBalancerModule,
} from "./balancer"
import {
    ConfigurableModuleClass,
} from "./ai.module-definition"

/**
 * AI module — invoke routing, ping, and key-rotation balancer.
 */
@Module({
    imports: [
        AiPingModule.register({
            isGlobal: false,
        }),
        AiBalancerModule.register({
            isGlobal: false,
        }),
    ],
    providers: [
        AiInvokeService,
        AiEntitlementService,
        GradingLaneValidationService,
        AiModelLatencyService,
    ],
    exports: [
        AiBalancerModule,
        AiPingModule,
        AiInvokeService,
        AiEntitlementService,
        GradingLaneValidationService,
        AiModelLatencyService,
    ],
})
export class AiModule extends ConfigurableModuleClass {}
