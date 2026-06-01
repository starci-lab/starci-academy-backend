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
} from "../shared/project-evaluation"
import {
    ReviewMilestoneTaskGradeStepService,
    ReviewMilestoneTaskCompleteStepService,
} from "./steps"
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
export class ReviewMilestoneTaskModule extends ConfigurableModuleClass {}
