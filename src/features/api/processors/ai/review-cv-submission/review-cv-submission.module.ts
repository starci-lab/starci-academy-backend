import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./review-cv-submission.module-definition"
import {
    ReviewCvSubmissionWorker,
} from "./review-cv-submission.worker"
import {
    ReviewCvSubmissionAnalyzeStepService,
    ReviewCvSubmissionCompleteStepService,
    ReviewCvSubmissionExtractStepService,
    ReviewCvSubmissionPlanStepService,
} from "./steps"
import {
    ReviewCvSubmissionStepMappingService 
} from "./step-mapping.service"
import {
    ReviewCvSubmissionParseService 
} from "./steps"

@Module({
    providers: [
        ReviewCvSubmissionWorker,
        ReviewCvSubmissionStepMappingService,
        ReviewCvSubmissionExtractStepService,
        ReviewCvSubmissionPlanStepService,
        ReviewCvSubmissionAnalyzeStepService,
        ReviewCvSubmissionCompleteStepService,
        ReviewCvSubmissionParseService,
    ],
    exports: [
        ReviewCvSubmissionWorker,
    ],
})
export class ReviewCvSubmissionModule extends ConfigurableModuleClass {}
