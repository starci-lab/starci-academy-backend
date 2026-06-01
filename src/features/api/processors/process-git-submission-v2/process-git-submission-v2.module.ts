import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./process-git-submission-v2.module-definition"
import {
    ProcessGitSubmissionV2GradeStepService,
} from "./steps"
import {
    ProcessGitSubmissionV2StepMappingService,
} from "./step-mapping.service"
import {
    ProcessGitSubmissionV2Worker,
} from "./process-git-submission-v2.worker"
import {
    ChallengeEvaluationParseService,
} from "../shared/challenge-evaluation"
import {
    ProcessGitSubmissionCompleteStepService,
    ProcessGitSubmissionGradeStepService,
} from "../process-git-submission/steps"

@Module({
    providers: [
        ProcessGitSubmissionV2Worker,
        ProcessGitSubmissionV2StepMappingService,
        ProcessGitSubmissionV2GradeStepService,
        // reused legacy services: complete step keys off the shared "grade" step name
        ProcessGitSubmissionCompleteStepService,
        ProcessGitSubmissionGradeStepService,
        ChallengeEvaluationParseService,
    ],
})
export class ProcessGitSubmissionV2Module extends ConfigurableModuleClass {}
