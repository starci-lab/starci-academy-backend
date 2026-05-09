import {
    Module,
} from "@nestjs/common"
import {
    ReviewPersonalProjectTaskWorker,
} from "./review-personal-project-task.worker"
import {
    ConfigurableModuleClass,
} from "./review-personal-project-task.module-definition"
import {
    ReviewPersonalProjectTaskGradeStepService,
    ReviewPersonalProjectTaskCompleteStepService,
} from "./steps"
import {
    ReviewPersonalProjectTaskStepMappingService,
} from "./step-mapping.service"

@Module({
    providers: [
        ReviewPersonalProjectTaskGradeStepService,
        ReviewPersonalProjectTaskCompleteStepService,
        ReviewPersonalProjectTaskStepMappingService,
        ReviewPersonalProjectTaskWorker,
    ],
})
export class ReviewPersonalProjectTaskModule extends ConfigurableModuleClass {}
