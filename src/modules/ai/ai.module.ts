import {
    Module,
} from "@nestjs/common"
import {
    AISecretService,
} from "./secret.service"
import {
    AiPingModule,
} from "./ping"
import {
    AiInvokeService,
} from "./ai-invoke.service"
import {
    AiEntitlementService,
} from "./ai-entitlement.service"
import {
    AiTaskModelService,
} from "./ai-task-model.service"
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
 * AI module — invoke routing, ping, secret management, and key-rotation balancer.
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
        AISecretService,
        AiInvokeService,
        AiEntitlementService,
        AiTaskModelService,
        GradingLaneValidationService,
    ],
    exports: [
        AiBalancerModule,
        AISecretService,
        AiPingModule,
        AiInvokeService,
        AiEntitlementService,
        AiTaskModelService,
        GradingLaneValidationService,
    ],
})
export class AiModule extends ConfigurableModuleClass {}
