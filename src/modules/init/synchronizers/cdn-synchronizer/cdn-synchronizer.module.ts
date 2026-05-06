import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./cdn-synchronizer.module-definition"
import {
    CdnSynchronizerService,
} from "./cdn-synchronizer.service"
import {
    CdnCourseBuildService,
    CdnModuleBuildService,
    CdnContentBuildService,
    CdnChallengeBuildService,
    CdnLessonVideoBuildService,
    MaterializeAndUploadService,
} from "./builder"
/**
 * Module for synchronizing the CDN.
 */
@Module({
    providers: [
        MaterializeAndUploadService,
        CdnCourseBuildService,
        CdnModuleBuildService,
        CdnContentBuildService,
        CdnChallengeBuildService,
        CdnLessonVideoBuildService,
        CdnSynchronizerService,
    ],
    exports: [
        CdnSynchronizerService,
    ],
})
export class CdnSynchronizerModule extends ConfigurableModuleClass { }
