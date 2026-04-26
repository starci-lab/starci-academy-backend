import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./sync-email-bloom-filter.module-definition"
import {
    SyncEmailBloomFilterStepMappingService,
} from "./step-mapping.service"
import {
    ProcessCompleteStepService,
    ProcessCreateBloomFilterStepService,
    ProcessSyncBatchEmailsStepService,
} from "./steps"
import {
    SyncEmailBloomFilterWorker,
} from "./sync-email-bloom-filter.worker"

@Module({
    providers: [
        ProcessCreateBloomFilterStepService,
        ProcessSyncBatchEmailsStepService,
        ProcessCompleteStepService,
        SyncEmailBloomFilterStepMappingService,
        SyncEmailBloomFilterWorker,
    ],
})
export class SyncEmailBloomFilterModule extends ConfigurableModuleClass {
}
