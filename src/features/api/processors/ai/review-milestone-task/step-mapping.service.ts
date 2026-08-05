import {
    Injectable,
} from "@nestjs/common"
import {
    AbstractStepService,
} from "@modules/bussiness"
import type {
    ReviewPersonalProjectTaskPayload,
} from "@modules/bullmq"
import {
    EmptyObject,
} from "@modules/common"
import {
    ReviewMilestoneTaskGradeStepService,
    ReviewMilestoneTaskCompleteStepService,
} from "./steps"

@Injectable()
/**
 * Maps step index → grade then complete so a failed grade never marks the review job
 * complete.
 */
export class ReviewMilestoneTaskStepMappingService {
    constructor(
        private readonly gradeStep: ReviewMilestoneTaskGradeStepService,
        private readonly completeStep: ReviewMilestoneTaskCompleteStepService,
    ) {}

    getStepMap(): Map<
        number,
        AbstractStepService<ReviewPersonalProjectTaskPayload, EmptyObject>
        > {
        const steps: Array<
            [number, AbstractStepService<ReviewPersonalProjectTaskPayload, EmptyObject>]
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
