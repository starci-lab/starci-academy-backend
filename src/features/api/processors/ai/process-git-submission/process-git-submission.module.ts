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
import {
    GradingRetrievalService,
} from "../shared/grading-retrieval"

@Module({
    providers: [
        ProcessGitSubmissionWorker,
        ProcessGitSubmissionStepMappingService,
        ProcessGitSubmissionGradeStepService,
        ProcessGitSubmissionCompleteStepService,
        ChallengeEvaluationParseService,
        GradingRetrievalService,
    ],
})
export class ProcessGitSubmissionModule extends ConfigurableModuleClass {}
