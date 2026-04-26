import {
    Injectable,
} from "@nestjs/common"
import {
    AbstractStepService,
} from "@modules/bussiness"
import type {
    SyncElasticsearchPayload,
} from "@modules/bullmq"
import {
    EmptyObject,
} from "@modules/common"
import {
    ProcessSyncElasticsearchCompleteStepService,
    ProcessSyncElasticsearchEntityStepService,
} from "./steps"

@Injectable()
export class SyncElasticsearchStepMappingService {
    constructor(
        private readonly elasticsearchEntityStep: ProcessSyncElasticsearchEntityStepService,
        private readonly elasticsearchCompleteStep: ProcessSyncElasticsearchCompleteStepService,
    ) {}

    getStepMap(): Map<
        number,
        AbstractStepService<SyncElasticsearchPayload, EmptyObject>
    > {
        const steps: Array<
            [number, AbstractStepService<SyncElasticsearchPayload, EmptyObject>]
        > = [
            [
                this.elasticsearchEntityStep.stepIndex,
                this.elasticsearchEntityStep,
            ],
            [
                this.elasticsearchCompleteStep.stepIndex,
                this.elasticsearchCompleteStep,
            ],
        ]
        return new Map(
            steps,
        )
    }
}
