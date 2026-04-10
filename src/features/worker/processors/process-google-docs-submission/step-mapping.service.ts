import {
    Injectable,
} from "@nestjs/common"
import type {
    ProcessGoogleDocsSubmissionPayload,
} from "@modules/bullmq"
import type {
    ExtendedProcessGoogleDocsSubmissionContext,
} from "./types"
import {
    ProcessGoogleDocsSubmissionCompleteStepService,
    ProcessGoogleDocsSubmissionGradeStepService,
    ProcessGoogleDocsSubmissionLoadDocsStepService,
    ProcessGoogleDocsSubmissionSplitDocsStepService,
    ProcessGoogleDocsSubmissionVectorizeStepService,
} from "./steps"
import { 
    AbstractStepService
} from "../abstracts"

/**
 * Google Docs submission pipeline: load docs → split → vectorize → grade → complete.
 */
@Injectable()
export class ProcessGoogleDocsSubmissionStepMappingService {
    constructor(
        private readonly loadDocsStepService: ProcessGoogleDocsSubmissionLoadDocsStepService,
        private readonly splitDocsStepService: ProcessGoogleDocsSubmissionSplitDocsStepService,
        private readonly vectorizeStepService: ProcessGoogleDocsSubmissionVectorizeStepService,
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
                    this.loadDocsStepService.stepIndex,
                    this.loadDocsStepService,
                ],
                [
                    this.splitDocsStepService.stepIndex,
                    this.splitDocsStepService,
                ],
                [
                    this.vectorizeStepService.stepIndex,
                    this.vectorizeStepService,
                ],
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
