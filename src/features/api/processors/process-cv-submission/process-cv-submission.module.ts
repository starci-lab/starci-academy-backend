import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./process-cv-submission.module-definition"
import {
    ProcessCvSubmissionWorker,
} from "./process-cv-submission.worker"
import {
    ProcessCvSubmissionExtractStepService,
    ProcessCvSubmissionAnalyzeStepService,
} from "./steps"
import {
    ProcessCVSubmissionStepMappingService 
} from "./step-mapping.service"

@Module({
    providers: [
        ProcessCvSubmissionWorker,
        ProcessCVSubmissionStepMappingService,
        ProcessCvSubmissionExtractStepService,
        ProcessCvSubmissionAnalyzeStepService,
    ],
    exports: [
        ProcessCvSubmissionWorker,
    ],
})
export class ProcessCvSubmissionModule extends ConfigurableModuleClass {}
