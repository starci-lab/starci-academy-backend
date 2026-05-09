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
    ReviewPersonalProjectTaskGradeStepService,
    ReviewPersonalProjectTaskCompleteStepService,
} from "./steps"

@Injectable()
export class ReviewPersonalProjectTaskStepMappingService {
    constructor(
        private readonly gradeStep: ReviewPersonalProjectTaskGradeStepService,
        private readonly completeStep: ReviewPersonalProjectTaskCompleteStepService,
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
