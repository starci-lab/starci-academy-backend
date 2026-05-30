import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./process-google-docs-submission-v2.module-definition"
import {
    LangchainModule,
} from "@modules/langchain"
import {
    ProcessGoogleDocsSubmissionV2StepMappingService,
} from "./step-mapping.service"
import {
    ProcessGoogleDocsSubmissionV2Worker,
} from "./process-google-docs-submission-v2.worker"
import {
    ProcessGoogleDocsSubmissionV2GradeStepService,
} from "./steps"
import {
    ProcessGoogleDocsSubmissionCompleteStepService,
    ProcessGoogleDocsSubmissionGradeStepService,
    ProcessGoogleDocsSubmissionParseService,
} from "../process-google-docs-submission/steps"

@Module({
    imports: [
        LangchainModule,
    ],
    providers: [
        ProcessGoogleDocsSubmissionV2Worker,
        ProcessGoogleDocsSubmissionV2StepMappingService,
        ProcessGoogleDocsSubmissionV2GradeStepService,
        // reused legacy services: complete step keys off the shared "grade" step name
        ProcessGoogleDocsSubmissionCompleteStepService,
        ProcessGoogleDocsSubmissionGradeStepService,
        ProcessGoogleDocsSubmissionParseService,
    ],
})
export class ProcessGoogleDocsSubmissionV2Module extends ConfigurableModuleClass {}
