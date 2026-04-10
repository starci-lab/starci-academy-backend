import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./process-google-docs-submission.module-definition"

import {
    ProcessGoogleDocsSubmissionStepMappingService,
} from "./step-mapping.service"
import {
    ProcessGoogleDocsSubmissionWorker,
} from "./process-google-docs-submission.worker"
import {
    LangchainModule,
} from "@modules/langchain"
import {
    ProcessGoogleDocsSubmissionLoadDocsStepService,
    ProcessGoogleDocsSubmissionSplitDocsStepService,
    ProcessGoogleDocsSubmissionVectorizeStepService,
    ProcessGoogleDocsSubmissionGradeStepService,
    ProcessGoogleDocsSubmissionCompleteStepService,
} from "./steps"

@Module({
    imports: [
        LangchainModule,
    ],
    providers: [
        ProcessGoogleDocsSubmissionWorker,
        ProcessGoogleDocsSubmissionStepMappingService,
        ProcessGoogleDocsSubmissionLoadDocsStepService,
        ProcessGoogleDocsSubmissionSplitDocsStepService,
        ProcessGoogleDocsSubmissionVectorizeStepService,
        ProcessGoogleDocsSubmissionGradeStepService,
        ProcessGoogleDocsSubmissionCompleteStepService,
    ],
})
export class ProcessGoogleDocsSubmissionModule extends ConfigurableModuleClass {}
