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
    ProcessGoogleDocsSubmissionGradeStepService,
    ProcessGoogleDocsSubmissionCompleteStepService,
    ProcessGoogleDocsSubmissionParseService,
} from "./steps"

@Module({
    imports: [
        LangchainModule,
    ],
    providers: [
        ProcessGoogleDocsSubmissionWorker,
        ProcessGoogleDocsSubmissionStepMappingService,
        ProcessGoogleDocsSubmissionGradeStepService,
        ProcessGoogleDocsSubmissionCompleteStepService,
        ProcessGoogleDocsSubmissionParseService,
    ],
})
export class ProcessGoogleDocsSubmissionModule extends ConfigurableModuleClass {}
