import {
    Injectable,
} from "@nestjs/common"
import {
    AbstractStepService,
} from "@modules/bussiness/jobs/types/context"
import type {
    EnqueueResolveGithubPayload,
} from "@modules/integrations/bullmq/types/payloads/resolve-github"
import {
    EmptyObject,
} from "@modules/lib/common/types/atomic"
import {
    ProcessResolveGithubCompleteStepService,
} from "./steps/process-resolve-github-complete-step.service"
import {
    ProcessResolveGithubSendStepService,
} from "./steps/process-resolve-github-send-step.service"
import {
    ProcessResolveGithubUpdateUserStepService,
} from "./steps/process-resolve-github-update-user-step.service"

@Injectable()
/**
 * Step map provider for resolve-github pipeline.
 */
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

