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
    ConfigurableModuleClass 
} from "./ai.module-definition"

/**
 * AI module — provides model routing, ping, and secret management.
 */
@Module({
    providers: [
        AISecretService,
        AiPingService,
        GenerateTaskModelRouterService,
        GradeModelRouterService,
        ReviewPersonalProjectModelRouterService,
        ReviewCvSubmissionModelRouterService,
    ],
    exports: [
        AISecretService,
        AiPingService,
        GenerateTaskModelRouterService,
        GradeModelRouterService,
        ReviewPersonalProjectModelRouterService,
        ReviewCvSubmissionModelRouterService,
    ],
})
export class AiModule extends ConfigurableModuleClass { }
