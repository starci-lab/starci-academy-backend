import {
    Injectable,
} from "@nestjs/common"
import {
    AbstractStepService,
} from "@modules/bussiness/jobs/types/context"
import type {
    ReviewPersonalProjectTaskPayload,
} from "@modules/integrations/bullmq/types/payloads/review-personal-project-task"
import {
    EmptyObject,
} from "@modules/lib/common/types/atomic"
import {
    ReviewMilestoneTaskCompleteStepService,
} from "./steps/review-milestone-task-complete-step.service"
import {
    ReviewMilestoneTaskGradeStepService,
} from "./steps/review-milestone-task-grade-step.service"

@Injectable()
/**
 * Maps step index -> grade then complete so a failed grade never marks the review job
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
