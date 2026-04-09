import {
    Injectable,
} from "@nestjs/common"
import {
    AbstractStepService,
} from "../abstracts"
import type {
    ProcessGitSubmissionPayload,
} from "@modules/bullmq"
import {
    ProcessGitSubmissionCompleteStepService,
    ProcessGitSubmissionGradeStepService,
} from "./steps"
import type {
    ExtendedProcessGitSubmissionContext,
} from "./types"

/**
 * Git submission pipeline: load repo → split → vectorize → grade → complete.
 */
@Injectable()
export class ProcessGitSubmissionStepMappingService {
    constructor(
        private readonly gradeStepService: ProcessGitSubmissionGradeStepService,
        private readonly completeStepService: ProcessGitSubmissionCompleteStepService,
    ) {}

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
