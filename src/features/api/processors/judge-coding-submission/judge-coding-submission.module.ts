import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./judge-coding-submission.module-definition"
import {
    JudgeCodingSubmissionWorker,
} from "./judge-coding-submission.worker"
import {
    JudgeCodingSubmissionStepMappingService,
} from "./step-mapping.service"
import {
    JudgeCodingSubmissionJudgeStepService,
} from "./steps/judge-coding-submission-judge-step.service"

@Module({
    providers: [
        JudgeCodingSubmissionWorker,
        JudgeCodingSubmissionStepMappingService,
        JudgeCodingSubmissionJudgeStepService,
    ],
})
/**
 * BullMQ processor module for judging coding submissions via Judge0. The judge
 * step submits batches through `Judge0Service`, which reaches it from the global
 * `Judge0Module` registration at the app root (naming-and-structure §8); the
 * worker self-registers with the `judge-coding-submission` queue.
 */
export class JudgeCodingSubmissionModule extends ConfigurableModuleClass {}
