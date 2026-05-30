import {
    Injectable,
} from "@nestjs/common"
import {
    AbstractStepService,
} from "@modules/bussiness"
import type {
    ProcessGitSubmissionPayload,
} from "@modules/bullmq"
import {
    ProcessGitSubmissionV2GradeStepService,
} from "./steps"
import {
    ProcessGitSubmissionCompleteStepService,
} from "../process-git-submission/steps"
import type {
    ExtendedProcessGitSubmissionContext,
} from "../process-git-submission/types"

/**
 * SCHEMA V2 git submission pipeline: load repo → split → vectorize → grade against criteria →
 * complete. Reuses the legacy complete step (it keys off the shared `grade` step name).
 */
@Injectable()
export class ProcessGitSubmissionV2StepMappingService {
    constructor(
        private readonly gradeStepService: ProcessGitSubmissionV2GradeStepService,
        private readonly completeStepService: ProcessGitSubmissionCompleteStepService,
    ) { }

    /**
     * Get the step map.
     * @returns The step map.
     */
    getStepMap(): Map<
        number,
        AbstractStepService<
            ProcessGitSubmissionPayload,
            ExtendedProcessGitSubmissionContext
        >
        > {
        return new Map<number, AbstractStepService<
            ProcessGitSubmissionPayload,
            ExtendedProcessGitSubmissionContext
        >>(
            [
                [
                    this.gradeStepService.stepIndex,
                    this.gradeStepService,
                ],
                [
                    this.completeStepService.stepIndex,
                    this.completeStepService,
                ],
            ],
        )
    }
}
