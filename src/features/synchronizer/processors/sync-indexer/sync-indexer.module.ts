import {
    Module
} from "@nestjs/common"
import {
    ConfigurableModuleClass
} from "./sync-indexer.module-definition"
import {
    SyncIndexerWorker
} from "./sync-indexer.worker"
import {
    ProcessSyncIndexerBuildParentIndexStep,
    ProcessSyncIndexerCompleteStep
} from "./steps"
import {
    SyncIndexerStepMappingService
} from "./step-mapping.service"
import {
    IndexerCourseBuildService,
    IndexerChallengeBuildService,
    IndexerContentBuildService,
    IndexerModuleBuildService
} from "./build"

@Module({
    providers: [
        ProcessSyncIndexerBuildParentIndexStep,
        ProcessSyncIndexerCompleteStep,
        SyncIndexerStepMappingService,
        SyncIndexerWorker,
        IndexerCourseBuildService,
        IndexerChallengeBuildService,
        IndexerContentBuildService,
        IndexerModuleBuildService,
    ],
    exports: [
        IndexerCourseBuildService,
        IndexerChallengeBuildService,
        IndexerContentBuildService,
        IndexerModuleBuildService,
    ]
})
export class SyncIndexerModule extends ConfigurableModuleClass {}

