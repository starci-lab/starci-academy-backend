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
} from "./builder"

/**
 * Module for synchronizing the Indexer.
 */
@Module({
    providers: [
        IndexerCourseBuildService,
        IndexerModuleBuildService,
        IndexerContentBuildService,
        IndexerChallengeBuildService,
        IndexerSynchronizerService,
    ],
    exports: [
        IndexerSynchronizerService,
    ]
})
export class IndexerSynchronizerModule extends ConfigurableModuleClass { }
