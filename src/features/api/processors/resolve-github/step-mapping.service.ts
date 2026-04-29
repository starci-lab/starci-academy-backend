import {
    Injectable,
} from "@nestjs/common"
import {
    AbstractStepService,
} from "@modules/bussiness"
import type {
    EnqueueResolveGithubPayload,
} from "@modules/bullmq"
import {
    EmptyObject,
} from "@modules/common"
import {
    ProcessResolveGithubSendStepService,
    ProcessResolveGithubUpdateUserStepService,
    ProcessResolveGithubCompleteStepService,
} from "./steps"

/**
 * Step map provider for resolve-github pipeline.
 */
@Injectable()
export class ResolveGithubStepMappingService {
    constructor(
        private readonly sendGithubStep: ProcessResolveGithubSendStepService,
        private readonly updateUserStep: ProcessResolveGithubUpdateUserStepService,
        private readonly completeStep: ProcessResolveGithubCompleteStepService,
    ) {}

    /**
     * Get the step map.
     * @returns The step map.
     */
    getStepMap(): Map<
        number,
        AbstractStepService<EnqueueResolveGithubPayload, EmptyObject>
        > {
        const steps: Array<
            [number, AbstractStepService<EnqueueResolveGithubPayload, EmptyObject>]
        > = [
            [
                this.sendGithubStep.stepIndex,
                this.sendGithubStep,
            ],
            [
                this.updateUserStep.stepIndex,
                this.updateUserStep,
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

