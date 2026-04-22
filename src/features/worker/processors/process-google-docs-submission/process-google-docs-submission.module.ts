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
    GoogleApisModule,
} from "@modules/googleapis"
import {
    ProcessGoogleDocsSubmissionGradeStepService,
    ProcessGoogleDocsSubmissionCompleteStepService,
} from "./steps"

@Module({
    imports: [
        LangchainModule,
        GoogleApisModule.register({}),
    ],
    providers: [
        ProcessGoogleDocsSubmissionWorker,
        ProcessGoogleDocsSubmissionStepMappingService,
        ProcessGoogleDocsSubmissionGradeStepService,
        ProcessGoogleDocsSubmissionCompleteStepService,
    ],
})
export class ProcessGoogleDocsSubmissionModule extends ConfigurableModuleClass {}
