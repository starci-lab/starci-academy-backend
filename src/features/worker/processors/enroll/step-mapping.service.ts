import {
    Injectable 
} from "@nestjs/common"
import {
    AbstractStepService 
} from "../abstracts"
import {
    EnrollStepService 
} from "./steps/enroll-step.service"

/**
 * Service for mapping steps.
 */
@Injectable()
export class StepMappingService {
    constructor(
        private readonly enrollStepService: EnrollStepService,
    ) {}

    /**
     * Get the step map.
     * @returns The step map.
     */
    getStepMap(): Map<number, AbstractStepService<unknown>> {
        return new Map(
            [
                [
                    this.enrollStepService.stepIndex,
                    this.enrollStepService
                ],
            ]
        )
    }
}