import {
    Injectable,
} from "@nestjs/common"
import {
    AbstractStepService,
} from "@modules/bussiness"
import type {
    JudgeCodingSubmissionPayload,
} from "@modules/bullmq"
import {
    JudgeCodingSubmissionJudgeStepService,
} from "./steps"
import type {
    ExtendedJudgeCodingSubmissionContext,
} from "./types"

@Injectable()
/**
 * Judge-coding-submission pipeline: a single step that submits the batch to
 * Judge0, waits for results, and persists the verdict.
 */
export class JudgeCodingSubmissionStepMappingService {
    constructor(
        private readonly judgeStepService: JudgeCodingSubmissionJudgeStepService,
    ) { }

    /**
     * Get the step map (stepIndex → step service).
     * @returns The step map.
     */
    getStepMap(): Map<
        number,
        AbstractStepService<
            JudgeCodingSubmissionPayload,
            ExtendedJudgeCodingSubmissionContext
        >
        > {
        // single-entry map keyed by the judge step's index
        return new Map<number, AbstractStepService<
            JudgeCodingSubmissionPayload,
            ExtendedJudgeCodingSubmissionContext
        >>(
            [
                [
                    this.judgeStepService.stepIndex,
                    this.judgeStepService,
                ],
            ],
        )
    }
}
