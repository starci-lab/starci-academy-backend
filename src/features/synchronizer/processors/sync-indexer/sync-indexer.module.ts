import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./sync-indexer.module-definition"
import {
    SyncIndexerWorker,
} from "./sync-indexer.worker"
import {
    ProcessSyncIndexerBuildParentIndexStep,
    ProcessSyncIndexerCompleteStep,
} from "./steps"
import {
    SyncIndexerStepMappingService,
} from "./step-mapping.service"
import {
    IndexerCourseBuildService,
    IndexerChallengeBuildService,
    IndexerContentBuildService,
    IndexerLessonVideoBuildService,
    IndexerModuleBuildService,
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
        IndexerLessonVideoBuildService,
        IndexerModuleBuildService,
    ],
    exports: [
        IndexerCourseBuildService,
        IndexerChallengeBuildService,
        IndexerContentBuildService,
        IndexerLessonVideoBuildService,
        IndexerModuleBuildService,
    ],
})
export class SyncIndexerModule extends ConfigurableModuleClass {}

