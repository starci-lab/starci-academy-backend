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
    ProcessGitSubmissionGradeStepService,
    ProcessGitSubmissionCompleteStepService,
} from "./steps"
import type {
    ExtendedProcessGitSubmissionContext,
} from "./types"

@Injectable()
/**
 * SCHEMA V2 git submission pipeline: load repo -> split -> vectorize -> grade against criteria ->
 * complete. Reuses the legacy complete step (it keys off the shared `grade` step name).
 */
export class ProcessGitSubmissionStepMappingService {
    constructor(
        private readonly gradeStepService: ProcessGitSubmissionGradeStepService,
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
