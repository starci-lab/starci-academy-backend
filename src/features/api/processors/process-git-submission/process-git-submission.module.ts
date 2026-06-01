import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./process-git-submission.module-definition"
import {
    ChallengeEvaluationParseService,
} from "../shared/challenge-evaluation"
import {
    ProcessGitSubmissionCompleteStepService,
    ProcessGitSubmissionGradeStepService,
} from "./steps"
import {
    ProcessGitSubmissionStepMappingService,
} from "./step-mapping.service"
import {
    ProcessGitSubmissionWorker,
} from "./process-git-submission.worker"
import {
    ProcessGitSubmissionRequeueService,
} from "./requeue.service"

@Module({
    providers: [
        ProcessGitSubmissionWorker,
        ProcessGitSubmissionStepMappingService,
        ProcessGitSubmissionGradeStepService,
        ProcessGitSubmissionCompleteStepService,
        ChallengeEvaluationParseService,
        ProcessGitSubmissionRequeueService,
    ],
})
export class ProcessGitSubmissionModule extends ConfigurableModuleClass {}
