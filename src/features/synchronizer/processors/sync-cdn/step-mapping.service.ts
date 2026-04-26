import {
    Injectable,
} from "@nestjs/common"
import {
    AbstractStepService,
} from "@modules/bullmq"
import type {
    SyncCdnPayload,
} from "@modules/bullmq"
import {
    EmptyObject,
} from "@modules/common"
import {
    ProcessCdnEntityStepService,
    ProcessCdnCompleteStepService,
} from "./steps"

@Injectable()
export class SyncCdnStepMappingService {
    constructor(
        private readonly cdnEntityStep: ProcessCdnEntityStepService,
        private readonly cdnCompleteStep: ProcessCdnCompleteStepService,
    ) {}

    getStepMap(): Map<
        number,
        AbstractStepService<SyncCdnPayload, EmptyObject>
    > {
        const steps: Array<
            [number, AbstractStepService<SyncCdnPayload, EmptyObject>]
        > = [
            [
                this.cdnEntityStep.stepIndex,
                this.cdnEntityStep,
            ],
            [
                this.cdnCompleteStep.stepIndex,
                this.cdnCompleteStep,
            ],
        ]
        return new Map(
            steps,
        )
    }
}
