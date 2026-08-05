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
    CdnChallengeBuildService,
} from "./builder/challenge.service"
import {
    CdnContentBuildService,
} from "./builder/content.service"
import {
    CdnCourseBuildService,
} from "./builder/course.service"
import {
    MaterializeAndUploadService,
} from "./builder/materialize-and-upload.service"
import {
    CdnMilestoneTaskBuildService,
} from "./builder/milestone-task.service"
import {
    CdnModuleBuildService,
} from "./builder/module.service"
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
