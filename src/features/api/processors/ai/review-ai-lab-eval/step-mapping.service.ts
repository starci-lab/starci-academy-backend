import {
    Injectable,
} from "@nestjs/common"
import {
    AbstractStepService,
} from "@modules/bussiness"
import type {
    ReviewAiLabEvalPayload,
} from "@modules/bullmq"
import {
    EmptyObject,
} from "@modules/common"
import {
    ReviewAiLabEvalGradeStepService,
    ReviewAiLabEvalCompleteStepService,
} from "./steps"

/**
 * Maps each step index of the AI Lab eval-runner to its handler so the worker
 * can drive `grade` (0) → `complete` (1) in order.
 */
@Injectable()
export class ReviewAiLabEvalStepMappingService {
    constructor(
        private readonly gradeStep: ReviewAiLabEvalGradeStepService,
        private readonly completeStep: ReviewAiLabEvalCompleteStepService,
    ) {}

    /**
     * Build the step-index → step-handler map for one eval-runner job.
     * @returns Map keyed by each step's `stepIndex`.
     */
    getStepMap(): Map<
        number,
        AbstractStepService<ReviewAiLabEvalPayload, EmptyObject>
        > {
        const steps: Array<
            [number, AbstractStepService<ReviewAiLabEvalPayload, EmptyObject>]
        > = [
            [
                this.gradeStep.stepIndex,
                this.gradeStep,
            ],
            [
                this.completeStep.stepIndex,
                this.completeStep,
            ],
        ]
        return new Map(
            steps,
        )
    }
}
