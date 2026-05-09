import {
    Injectable,
} from "@nestjs/common"
import {
    AbstractStepService,
} from "@modules/bussiness"
import type {
    ProcessPersonalProjectPayload,
} from "@modules/bullmq"
import {
    EmptyObject,
} from "@modules/common"
import {
    ProcessPersonalProjectGradeStepService,
    ProcessPersonalProjectCompleteStepService,
} from "./steps"

@Injectable()
export class ProcessPersonalProjectStepMappingService {
    constructor(
        private readonly gradeStep: ProcessPersonalProjectGradeStepService,
        private readonly completeStep: ProcessPersonalProjectCompleteStepService,
    ) {}

    getStepMap(): Map<
        number,
        AbstractStepService<ProcessPersonalProjectPayload, EmptyObject>
        > {
        const steps: Array<
            [number, AbstractStepService<ProcessPersonalProjectPayload, EmptyObject>]
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
