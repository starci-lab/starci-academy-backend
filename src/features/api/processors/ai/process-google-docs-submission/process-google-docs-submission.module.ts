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
    ProcessGoogleDocsSubmissionGradeStepService,
    ProcessGoogleDocsSubmissionCompleteStepService,
} from "./steps"
import {
    ChallengeEvaluationParseService,
} from "../shared/challenge-evaluation"

@Module({
    providers: [
        ProcessGoogleDocsSubmissionWorker,
        ProcessGoogleDocsSubmissionStepMappingService,
        ProcessGoogleDocsSubmissionGradeStepService,
        ProcessGoogleDocsSubmissionCompleteStepService,
        ChallengeEvaluationParseService,
    ],
})
/**
 * Wires Google-Docs submission grade + complete steps so the worker stays a dumb runner
 * over the step map.
 */
export class ProcessGoogleDocsSubmissionModule extends ConfigurableModuleClass {}
