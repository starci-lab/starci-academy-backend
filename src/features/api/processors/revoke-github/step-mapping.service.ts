import {
    Injectable,
} from "@nestjs/common"
import {
    AbstractStepService,
} from "@modules/bussiness/jobs/types/context"
import type {
    EnqueueRevokeGithubPayload,
} from "@modules/integrations/bullmq/types/payloads/revoke-github"
import {
    EmptyObject,
} from "@modules/lib/common/types/atomic"
import {
    ProcessRevokeGithubRemoveStepService,
} from "./steps/process-revoke-github-remove-step.service"

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
