import {
    Module,
} from "@nestjs/common"
import {
    ReviewMilestoneTaskWorker,
} from "./review-milestone-task.worker"
import {
    ConfigurableModuleClass,
} from "./review-milestone-task.module-definition"
import {
    ProjectEvaluationParseService,
} from "../shared/project-evaluation/project-evaluation-parse.service"
import {
    ReviewMilestoneTaskCompleteStepService,
} from "./steps/review-milestone-task-complete-step.service"
import {
    ReviewMilestoneTaskGradeStepService,
} from "./steps/review-milestone-task-grade-step.service"
import {
    ReviewMilestoneTaskStepMappingService,
} from "./step-mapping.service"

@Module({
    providers: [
        ReviewMilestoneTaskGradeStepService,
        ReviewMilestoneTaskCompleteStepService,
        ReviewMilestoneTaskStepMappingService,
        ReviewMilestoneTaskWorker,
        ProjectEvaluationParseService,
    ],
})
/**
 * Wires milestone-task review grade + complete steps so personal-project AI review does
 * not live in the GraphQL mutation module.
 */
export class ReviewMilestoneTaskModule extends ConfigurableModuleClass {}
