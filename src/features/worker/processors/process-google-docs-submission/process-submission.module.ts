import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./process-submission.module-definition"
import {
    ProcessGitSubmissionCompleteStepService,
    ProcessGitSubmissionGradeStepService,
    ProcessGitSubmissionLoadDocsStepService,
    ProcessGitSubmissionSplitDocsStepService,
    ProcessGitSubmissionVectorizeStepService,
} from "./steps"
import {
    ProcessGitSubmissionStepMappingService,
} from "./step-mapping.service"
import {
    ProcessGitSubmissionWorker,
} from "./process-submission.worker"

@Module({
    providers: [
        ProcessGitSubmissionWorker,
        ProcessGitSubmissionStepMappingService,
        ProcessGitSubmissionLoadDocsStepService,
        ProcessGitSubmissionSplitDocsStepService,
        ProcessGitSubmissionVectorizeStepService,
        ProcessGitSubmissionGradeStepService,
        ProcessGitSubmissionCompleteStepService,
    ],
})
export class ProcessGitSubmissionModule extends ConfigurableModuleClass {}
