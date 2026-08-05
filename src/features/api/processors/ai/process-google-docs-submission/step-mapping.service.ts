import {
    Injectable,
} from "@nestjs/common"
import {
    AbstractStepService,
} from "@modules/bussiness/jobs/types/context"
import type {
    ProcessGoogleDocsSubmissionPayload,
} from "@modules/integrations/bullmq/types/payloads/process-google-docs-submission"
import type {
    ExtendedProcessGoogleDocsSubmissionContext,
} from "./types/extended"
import {
    ProcessGoogleDocsSubmissionGradeStepService,
} from "./steps/process-google-docs-submission-grade-step.service"
import {
    ProcessGoogleDocsSubmissionCompleteStepService,
} from "./steps/process-submission-complete-step.service"

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
