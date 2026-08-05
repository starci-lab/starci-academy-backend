import {
    Injectable
} from "@nestjs/common"
import {
    AbstractStepService,
} from "@modules/bussiness/jobs/types/context"
import {
    EnrollStepService,
} from "./steps/enroll-step.service"
import type {
    EnrollPayload,
} from "@modules/integrations/bullmq/types/payloads/enroll"

@Injectable()
/**
 * Service for mapping steps.
 */
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