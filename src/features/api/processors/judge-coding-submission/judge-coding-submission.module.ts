import {
    Module,
} from "@nestjs/common"
import {
    Judge0Module,
} from "@modules/judge0"
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
} from "./steps"

@Module({
    imports: [
        Judge0Module.register({
        }),
    ],
    providers: [
        JudgeCodingSubmissionWorker,
        JudgeCodingSubmissionStepMappingService,
        JudgeCodingSubmissionJudgeStepService,
    ],
})
/**
 * BullMQ processor module for judging coding submissions via Judge0. Imports the
 * Judge0 client so the judge step can submit batches; the worker self-registers
 * with the `judge-coding-submission` queue.
 */
export class JudgeCodingSubmissionModule extends ConfigurableModuleClass {}
