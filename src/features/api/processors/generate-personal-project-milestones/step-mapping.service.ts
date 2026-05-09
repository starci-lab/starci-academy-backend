import {
    Injectable,
} from "@nestjs/common"
import {
    AbstractStepService,
} from "@modules/bussiness"
import type {
    GeneratePersonalProjectMilestonesPayload,
} from "@modules/bullmq"
import {
    EmptyObject,
} from "@modules/common"
import {
    GenerateMilestonesStepService,
    GenerateMilestonesCompleteStepService,
} from "./steps"

@Injectable()
export class GenerateMilestonesStepMappingService {
    constructor(
        private readonly generateMilestonesStep: GenerateMilestonesStepService,
        private readonly generateMilestonesCompleteStep: GenerateMilestonesCompleteStepService,
    ) {}

    getStepMap(): Map<
        number,
        AbstractStepService<GeneratePersonalProjectMilestonesPayload, EmptyObject>
        > {
        const steps: Array<
            [number, AbstractStepService<GeneratePersonalProjectMilestonesPayload, EmptyObject>]
        > = [
            [
                this.generateMilestonesStep.stepIndex,
                this.generateMilestonesStep,
            ],
            [
                this.generateMilestonesCompleteStep.stepIndex,
                this.generateMilestonesCompleteStep,
            ],
        ]
        return new Map(
            steps,
        )
    }
}
