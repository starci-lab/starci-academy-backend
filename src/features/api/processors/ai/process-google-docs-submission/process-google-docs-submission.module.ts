import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./process-google-docs-submission.module-definition"
import {
    LangchainModule,
} from "@modules/langchain"
import {
    ProcessGoogleDocsSubmissionStepMappingService,
} from "./step-mapping.service"
import {
    ProcessGoogleDocsSubmissionWorker,
} from "./process-google-docs-submission.worker"
import {
    ProcessGoogleDocsSubmissionGradeStepService,
    ProcessGoogleDocsSubmissionCompleteStepService,
} from "./steps"
import {
    ChallengeEvaluationParseService,
} from "../shared/challenge-evaluation"
import {
    GradingRetrievalService,
} from "../shared/grading-retrieval"

@Module({
    imports: [
        LangchainModule,
    ],
    providers: [
        ProcessGoogleDocsSubmissionWorker,
        ProcessGoogleDocsSubmissionStepMappingService,
        ProcessGoogleDocsSubmissionGradeStepService,
        ProcessGoogleDocsSubmissionCompleteStepService,
        ChallengeEvaluationParseService,
        GradingRetrievalService,
    ],
})
export class ProcessGoogleDocsSubmissionModule extends ConfigurableModuleClass {}
