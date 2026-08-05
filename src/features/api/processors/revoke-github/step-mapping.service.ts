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

@Injectable()
/**
 * Step map provider for revoke-github pipeline.
 */
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
