import {
    Injectable,
} from "@nestjs/common"
import {
    AbstractStepService,
} from "@modules/bussiness/jobs/types/context"
import type {
    JudgeCodingSubmissionPayload,
} from "@modules/integrations/bullmq/types/payloads/judge-coding-submission"
import {
    JudgeCodingSubmissionJudgeStepService,
} from "./steps/judge-coding-submission-judge-step.service"
import type {
    ExtendedJudgeCodingSubmissionContext,
} from "./types/extended"

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
     * Get the step map (stepIndex -> step service).
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
