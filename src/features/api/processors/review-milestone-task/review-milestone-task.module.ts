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
    ReviewMilestoneTaskGradeStepService,
    ReviewMilestoneTaskCompleteStepService,
    ReviewMilestoneTaskParseService,
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
        ReviewMilestoneTaskParseService
    ],
})
export class ReviewMilestoneTaskModule extends ConfigurableModuleClass {}
