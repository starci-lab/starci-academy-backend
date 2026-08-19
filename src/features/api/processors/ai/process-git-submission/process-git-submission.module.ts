import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./process-git-submission.module-definition"
import {
    ProcessGitSubmissionCompleteStepService,
} from "./steps/process-git-submission-complete-step.service"
import {
    ProcessGitSubmissionGradeStepService,
} from "./steps/process-git-submission-grade-step.service"
import {
    ProcessGitSubmissionStepMappingService,
} from "./step-mapping.service"
import {
    ProcessGitSubmissionWorker,
} from "./process-git-submission.worker"
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
        ProcessGitSubmissionWorker,
        ProcessGitSubmissionStepMappingService,
        ProcessGitSubmissionGradeStepService,
        ProcessGitSubmissionCompleteStepService,
        ChallengeEvaluationParseService,
        ChallengeEvaluationPromptService,
    ],
})
/**
 * Wires git-submission grade + complete steps so the worker stays a dumb runner over the
 * step map.
 */
export class ProcessGitSubmissionModule extends ConfigurableModuleClass {}
