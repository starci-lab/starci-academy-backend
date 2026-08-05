import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./process-git-submission.module-definition"
import {
    ProcessGitSubmissionGradeStepService,
    ProcessGitSubmissionCompleteStepService,
} from "./steps"
import {
    ProcessGitSubmissionStepMappingService,
} from "./step-mapping.service"
import {
    ProcessGitSubmissionWorker,
} from "./process-git-submission.worker"
import {
    ChallengeEvaluationParseService,
} from "../shared/challenge-evaluation"

@Module({
    providers: [
        ProcessGitSubmissionWorker,
        ProcessGitSubmissionStepMappingService,
        ProcessGitSubmissionGradeStepService,
        ProcessGitSubmissionCompleteStepService,
        ChallengeEvaluationParseService,
    ],
})
/**
 * Wires git-submission grade + complete steps so the worker stays a dumb runner over the
 * step map.
 */
export class ProcessGitSubmissionModule extends ConfigurableModuleClass {}
