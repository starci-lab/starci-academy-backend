import {
    Injectable,
} from "@nestjs/common"
import {
    AbstractStepService,
} from "@modules/bussiness"
import type {
    SyncIndexerPayload,
} from "@modules/bullmq"
import {
    EmptyObject,
} from "@modules/common"
import {
    ProcessSyncIndexerBuildParentIndexStep,
    ProcessSyncIndexerCompleteStep,
} from "./steps"

@Injectable()
export class SyncIndexerStepMappingService {
    constructor(
        private readonly syncIndexerBuildParentIndexStepService: ProcessSyncIndexerBuildParentIndexStep,
        private readonly syncIndexerCompleteStepService: ProcessSyncIndexerCompleteStep,
    ) {}

    getStepMap(): Map<
        number,
        AbstractStepService<
            SyncIndexerPayload,
            EmptyObject
        >
        > {
        return new Map<
            number,
            AbstractStepService<
                SyncIndexerPayload,
                EmptyObject
            >
        >(
            [
                [
                    this.syncIndexerBuildParentIndexStepService.stepIndex,
                    this.syncIndexerBuildParentIndexStepService,
                ],
                [
                    this.syncIndexerCompleteStepService.stepIndex,
                    this.syncIndexerCompleteStepService,
                ],
            ],
        )
    }
}

