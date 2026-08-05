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
    IndexerChallengeBuildService,
} from "./builder/challenge.service"
import {
    IndexerContentBuildService,
} from "./builder/content.service"
import {
    IndexerCourseBuildService,
} from "./builder/course.service"
import {
    IndexerFlashcardDeckBuildService,
} from "./builder/flashcard-deck.service"
import {
    IndexerMilestoneTaskBuildService,
} from "./builder/milestone-task.service"
import {
    IndexerMilestoneBuildService,
} from "./builder/milestone.service"
import {
    IndexerModuleBuildService,
} from "./builder/module.service"

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
