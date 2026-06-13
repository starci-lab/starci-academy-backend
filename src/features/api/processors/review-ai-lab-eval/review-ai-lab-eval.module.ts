import {
    Module,
} from "@nestjs/common"
import {
    ReviewAiLabEvalWorker,
} from "./review-ai-lab-eval.worker"
import {
    ConfigurableModuleClass,
} from "./review-ai-lab-eval.module-definition"
import {
    ReviewAiLabEvalGradeStepService,
    ReviewAiLabEvalCompleteStepService,
} from "./steps"
import {
    ReviewAiLabEvalStepMappingService,
} from "./step-mapping.service"

/**
 * Module wiring the AI Lab eval-runner worker + its grade / complete steps.
 */
@Module({
    providers: [
        ReviewAiLabEvalGradeStepService,
        ReviewAiLabEvalCompleteStepService,
        ReviewAiLabEvalStepMappingService,
        ReviewAiLabEvalWorker,
    ],
})
export class ReviewAiLabEvalModule extends ConfigurableModuleClass {}
