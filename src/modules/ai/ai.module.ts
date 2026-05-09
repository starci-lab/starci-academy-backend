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
    GenerateMilestoneModelRouterService,
} from "./generate-milestone-router.service"
import {
    GradeModelRouterService,
} from "./grade-model-router.service"
import {
    ConfigurableModuleClass 
} from "./ai.module-definition"

/**
 * AI module — provides model routing, ping, and secret management.
 */
@Module({
    providers: [
        AISecretService,
        AiPingService,
        GenerateMilestoneModelRouterService,
        GradeModelRouterService,
    ],
    exports: [
        AISecretService,
        AiPingService,
        GenerateMilestoneModelRouterService,
        GradeModelRouterService,
    ],
})
export class AiModule extends ConfigurableModuleClass { }
