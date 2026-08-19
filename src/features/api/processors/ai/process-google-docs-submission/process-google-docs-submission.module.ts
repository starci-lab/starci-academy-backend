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
} from "./steps/process-google-docs-submission-grade-step.service"
import {
    ProcessGoogleDocsSubmissionCompleteStepService,
} from "./steps/process-submission-complete-step.service"
import {
    ChallengeEvaluationParseService,
} from "../shared/challenge-evaluation/challenge-evaluation-parse.service"
import {
    ChallengeEvaluationPromptService,
} from "../shared/challenge-evaluation/challenge-evaluation-prompt.service"
import {
    ChallengeSubmissionCompletionModule,
} from "../shared/challenge-submission/challenge-submission-completion.module"

@Module({
    imports: [
        ChallengeSubmissionCompletionModule,
    ],
    providers: [
        ProcessGoogleDocsSubmissionWorker,
        ProcessGoogleDocsSubmissionStepMappingService,
        ProcessGoogleDocsSubmissionGradeStepService,
        ProcessGoogleDocsSubmissionCompleteStepService,
        ChallengeEvaluationParseService,
        ChallengeEvaluationPromptService,
    ],
})
/**
 * Wires Google-Docs submission grade + complete steps so the worker stays a dumb runner
 * over the step map.
 */
export class ProcessGoogleDocsSubmissionModule extends ConfigurableModuleClass {}
