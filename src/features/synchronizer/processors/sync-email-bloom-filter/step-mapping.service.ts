import {
    Injectable,
} from "@nestjs/common"
import {
    AbstractStepService,
} from "@modules/bussiness"
import type {
    SyncEmailBloomFilterPayload,
} from "@modules/bullmq"
import {
    ProcessCreateBloomFilterStepService, 
    ProcessSyncBatchEmailsStepService,
    ProcessCompleteStepService,
} from "./steps"
import {
    EmptyObject,
} from "@modules/common"

/**
 * Sync email bloom filter: create → batch emails → complete (3 steps).
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
