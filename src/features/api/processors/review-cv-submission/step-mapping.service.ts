import {
    Injectable,
} from "@nestjs/common"
import {
    AbstractStepService,
} from "@modules/bussiness"
import {
    ReviewCvSubmissionAnalyzeStepService,
    ReviewCvSubmissionCompleteStepService,
    ReviewCvSubmissionExtractStepService,
    ReviewCvSubmissionPlanStepService,
} from "./steps"
import {
    ExtendedReviewCvSubmissionContext
} from "./types"
import {
    ReviewCvSubmissionPayload 
} from "@modules/bullmq"

/**
 * CV submission pipeline: extract → plan (AI) → analyze → complete.
 */
@Injectable()
export class ReviewCvSubmissionStepMappingService {
    constructor(
        private readonly extractStepService: ReviewCvSubmissionExtractStepService,
        private readonly planStepService: ReviewCvSubmissionPlanStepService,
        private readonly analyzeStepService: ReviewCvSubmissionAnalyzeStepService,
        private readonly completeStepService: ReviewCvSubmissionCompleteStepService,
    ) { }

    /**
     * Get the step map.
     * @returns The step map.
     */
    getStepMap(): Map<
        number,
        AbstractStepService<
            ReviewCvSubmissionPayload,
            ExtendedReviewCvSubmissionContext
        >
        > {
        return new Map<number, AbstractStepService<
            ReviewCvSubmissionPayload,
            ExtendedReviewCvSubmissionContext
        >>(
            [
                [
                    this.extractStepService.stepIndex,
                    this.extractStepService,
                ],
                [
                    this.planStepService.stepIndex,
                    this.planStepService,
                ],
                [
                    this.analyzeStepService.stepIndex,
                    this.analyzeStepService,
                ],
                [
                    this.completeStepService.stepIndex,
                    this.completeStepService,
                ],
            ],
        )
    }
}
