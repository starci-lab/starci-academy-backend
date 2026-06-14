import {
    Injectable,
} from "@nestjs/common"
import {
    AbstractStepService,
} from "@modules/bussiness"
import type {
    EnqueueRevokeGithubPayload,
} from "@modules/bullmq"
import {
    EmptyObject,
} from "@modules/common"
import {
    ProcessRevokeGithubRemoveStepService,
} from "./steps"

/**
 * Step map provider for revoke-github pipeline.
 */
@Injectable()
export class RevokeGithubStepMappingService {
    constructor(
        private readonly removeGithubStep: ProcessRevokeGithubRemoveStepService,
    ) {}

    /**
     * Get the step map.
     * @returns The step map.
     */
    getStepMap(): Map<
        number,
        AbstractStepService<EnqueueRevokeGithubPayload, EmptyObject>
        > {
        const steps: Array<
            [number, AbstractStepService<EnqueueRevokeGithubPayload, EmptyObject>]
        > = [
            [
                this.removeGithubStep.stepIndex,
                this.removeGithubStep,
            ],
        ]
        return new Map(
            steps,
        )
    }
}
