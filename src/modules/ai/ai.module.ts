import {
    Module,
} from "@nestjs/common"
import {
    AISecretService,
} from "./secret.service"
import {
    AiPingService,
} from "./ping.service"
import {
    GenerateTaskModelRouterService,
} from "./generate-milestone-router.service"
import {
    GradeModelRouterService,
} from "./grade-model-router.service"
import {
    ReviewPersonalProjectModelRouterService,
} from "./review-personal-project-router.service"
import {
    ReviewCvSubmissionModelRouterService,
} from "./review-cv-submission-model-router.service"
import {
    AiInvokeService,
} from "./ai-invoke.service"
import {
    AiEntitlementService,
} from "./ai-entitlement.service"
import {
    AiBalancerModule,
} from "./balancer"
import {
    CryptoModule,
} from "@modules/crypto"
import {
    ConfigurableModuleClass,
} from "./ai.module-definition"

/**
 * AI module — model routing, ping, secret management, and key-rotation balancer.
 *
 * Sub-modules:
 * - {@link AiBalancerModule} — key pool, health check, UseApiService (re-exported).
 *
 * Consumers import from `@modules/ai` — never from sub-paths directly.
 */
@Module({
    imports: [
        AiBalancerModule.register({
        }),
        CryptoModule.register({
        }),
    ],
    providers: [
        AISecretService,
        AiPingService,
        AiInvokeService,
        AiEntitlementService,
        GenerateTaskModelRouterService,
        GradeModelRouterService,
        ReviewPersonalProjectModelRouterService,
        ReviewCvSubmissionModelRouterService,
    ],
    exports: [
        AiBalancerModule,
        AISecretService,
        AiPingService,
        AiInvokeService,
        AiEntitlementService,
        GenerateTaskModelRouterService,
        GradeModelRouterService,
        ReviewPersonalProjectModelRouterService,
        ReviewCvSubmissionModelRouterService,
    ],
})
export class AiModule extends ConfigurableModuleClass {}
