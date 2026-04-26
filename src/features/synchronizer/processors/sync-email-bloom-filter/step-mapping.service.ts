import {
    Injectable,
} from "@nestjs/common"
import {
    AbstractStepService,
} from "@modules/bullmq"
import type {
    SyncEmailBloomFilterPayload,
} from "@modules/bullmq"
import type {
} from "./types"
import {
    EmptyObject 
} from "@modules/common"
import {
    ProcessCreateBloomFilterStepService, 
    ProcessSyncBatchEmailsStepService,
    ProcessCompleteStepService,
} from "./steps"

/**
 * Google Docs submission pipeline: grade → complete (2-step).
 */
@Injectable()
export class SyncEmailBloomFilterStepMappingService {
    constructor(
        private readonly createBloomFilterStepService: ProcessCreateBloomFilterStepService,
        private readonly syncBatchEmailsStepService: ProcessSyncBatchEmailsStepService,
        private readonly completeStepService: ProcessCompleteStepService,
    ) {}

    /**
     * Get the step map.
     * @returns The step map.
     */
    getStepMap(): Map<
        number,
        AbstractStepService<
            SyncEmailBloomFilterPayload,
            EmptyObject
        >
        > {
        return new Map<number, AbstractStepService<
            SyncEmailBloomFilterPayload,
            EmptyObject
        >>(
            [
                [
                    this.createBloomFilterStepService.stepIndex,
                    this.createBloomFilterStepService,
                ],
                [
                    this.syncBatchEmailsStepService.stepIndex,
                    this.syncBatchEmailsStepService,
                ],
                [
                    this.completeStepService.stepIndex,
                    this.completeStepService,
                ],
            ],
        )
    }
}
