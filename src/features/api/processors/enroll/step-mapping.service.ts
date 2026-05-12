import {
    Injectable
} from "@nestjs/common"
import {
    AbstractStepService
} from "@modules/bullmq"
import {
    EnrollStepService
} from "./steps"
import type {
    EnrollPayload,
} from "@modules/bullmq"

/**
 * Service for mapping steps.
 */
@Injectable()
export class StepMappingService {
    constructor(
        private readonly enrollStepService: EnrollStepService,
    ) { }

    /**
     * Get the step map.
     * @returns The step map.
     */
    getStepMap(): Map<number, AbstractStepService<EnrollPayload, undefined>> {
        return new Map<number, AbstractStepService<EnrollPayload, undefined>>(
            [
                [
                    this.enrollStepService.stepIndex,
                    this.enrollStepService
                ],
            ]
        )
    }
}