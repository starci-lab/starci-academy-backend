import {
    Injectable,
} from "@nestjs/common"
import {
    AbstractStepService,
} from "@modules/bussiness"
import type {
    ProcessGoogleDocsSubmissionPayload,
} from "@modules/bullmq"
import type {
    ExtendedProcessGoogleDocsSubmissionContext,
} from "./types"
import {
    ProcessGoogleDocsSubmissionGradeStepService,
    ProcessGoogleDocsSubmissionCompleteStepService,
} from "./steps"

@Injectable()
/**
 * SCHEMA V2 Google Docs submission pipeline: grade against criteria -> complete (2-step). Reuses the
 * legacy complete step (it keys off the shared `grade` step name).
 */
export class ProcessGoogleDocsSubmissionStepMappingService {
    constructor(
        private readonly gradeStepService: ProcessGoogleDocsSubmissionGradeStepService,
        private readonly completeStepService: ProcessGoogleDocsSubmissionCompleteStepService,
    ) {}

    /**
     * Get the step map.
     * @returns The step map.
     */
    getStepMap(): Map<
        number,
        AbstractStepService<
            ProcessGoogleDocsSubmissionPayload,
            ExtendedProcessGoogleDocsSubmissionContext
        >
        > {
        return new Map<number, AbstractStepService<
            ProcessGoogleDocsSubmissionPayload,
            ExtendedProcessGoogleDocsSubmissionContext
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
