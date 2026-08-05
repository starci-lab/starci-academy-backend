import {
    Module
} from "@nestjs/common"
import {
    ConfigurableModuleClass
} from "./indexer-synchronizer.module-definition"
import {
    IndexerSynchronizerService
} from "./indexer-synchronizer.service"
import {
    IndexerCourseBuildService,
    IndexerModuleBuildService,
    IndexerContentBuildService,
    IndexerChallengeBuildService,
    IndexerMilestoneBuildService,
    IndexerMilestoneTaskBuildService,
    IndexerFlashcardDeckBuildService,
} from "./builder"

@Module({
    providers: [
        IndexerCourseBuildService,
        IndexerModuleBuildService,
        IndexerContentBuildService,
        IndexerChallengeBuildService,
        IndexerMilestoneBuildService,
        IndexerMilestoneTaskBuildService,
        IndexerFlashcardDeckBuildService,
        IndexerSynchronizerService,
    ],
    exports: [
        IndexerSynchronizerService,
    ]
})
/**
 * Module for synchronizing the Indexer.
 */
export class IndexerSynchronizerModule extends ConfigurableModuleClass { }
