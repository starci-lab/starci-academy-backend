import {
    Injectable
} from "@nestjs/common"
import {
    FilenameProcessData
} from "@modules/bullmq"
import {
    ProcessVideoInitStepService,
    ProcessVideoEncodeStepService,
    ProcessVideoPackageStepService,
    ProcessVideoUploadStepService,
    ProcessVideoFinalizeStepService,
} from "./steps"
import {
    AbstractStepService 
} from "@modules/bussiness"

@Injectable()
/**
 * Indexes steps by `stepIndex` so the worker dispatches from persisted
 * `job.currentStep` rather than a hardcoded array — inserting a step only
 * requires updating its index.
 */
export class StepMappingService {
    constructor(
        private readonly initStepService: ProcessVideoInitStepService,
        private readonly encodeStepService: ProcessVideoEncodeStepService,
        private readonly packageStepService: ProcessVideoPackageStepService,
        private readonly uploadStepService: ProcessVideoUploadStepService,
        private readonly finalizeStepService: ProcessVideoFinalizeStepService,
    ) { }

    /**
     * Get the step map.
     * @returns The step map.
     */
    getStepMap(): Map<number, AbstractStepService<FilenameProcessData, undefined>> {
        return new Map<number, AbstractStepService<FilenameProcessData, undefined>>(
            [
                [
                    this.initStepService.stepIndex,
                    this.initStepService,
                ],
                [
                    this.encodeStepService.stepIndex,
                    this.encodeStepService,
                ],
                [
                    this.packageStepService.stepIndex,
                    this.packageStepService,
                ],
                [
                    this.uploadStepService.stepIndex,
                    this.uploadStepService,
                ],
                [
                    this.finalizeStepService.stepIndex,
                    this.finalizeStepService,
                ],
            ],
        )
    }
}
