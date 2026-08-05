import {
    Module
} from "@nestjs/common"
import {
    ConfigurableModuleClass
} from "./cdn-synchronizer.module-definition"
import {
    CdnSynchronizerService
} from "./cdn-synchronizer.service"
import {
    CdnCourseBuildService,
    CdnModuleBuildService,
    CdnContentBuildService,
    CdnChallengeBuildService,
    CdnMilestoneTaskBuildService,
    MaterializeAndUploadService
} from "./builder"
@Module({
    providers: [
        MaterializeAndUploadService,
        CdnCourseBuildService,
        CdnModuleBuildService,
        CdnContentBuildService,
        CdnChallengeBuildService,
        CdnMilestoneTaskBuildService,
        CdnSynchronizerService,
    ],
    exports: [
        CdnSynchronizerService,
    ]
})
/**
 * Module for synchronizing the CDN.
 */
export class CdnSynchronizerModule extends ConfigurableModuleClass { }
