import type {
    ProcessCVSubmissionPayload,
} from "@modules/bullmq"
import {
    Injectable,
} from "@nestjs/common"
import {
    AbstractStepService,
} from "../abstracts"
import {
    ProcessCvSubmissionAnalyzeStepService,
    ProcessCvSubmissionExtractStepService
} from "./steps"
import {
    ExtendedProcessCvSubmissionContext 
} from "./types"

/**
 * CV submission pipeline: extract Pdf | Docs → Analyze → complete.
 */
@Injectable()
export class ProcessCVSubmissionStepMappingService {
    constructor(
        private readonly extractStepService: ProcessCvSubmissionExtractStepService,
        private readonly analyzeStepService: ProcessCvSubmissionAnalyzeStepService,
    ) {}

    /**
     * Get the step map.
     * @returns The step map.
     */
    getStepMap(): Map<
        number,
        AbstractStepService<
            ProcessCVSubmissionPayload,
            ExtendedProcessCvSubmissionContext
        >
        > {
        return new Map<number, AbstractStepService<
            ProcessCVSubmissionPayload,
            ExtendedProcessCvSubmissionContext
        >>(
            [
                [
                    this.extractStepService.stepIndex,
                    this.extractStepService,
                ],
                [
                    this.analyzeStepService.stepIndex,
                    this.analyzeStepService,
                ],
            ],
        )
    }
}
