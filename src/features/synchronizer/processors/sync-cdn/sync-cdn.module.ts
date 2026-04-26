import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./sync-cdn.module-definition"
import {
    CdnChallengeBuildService,
    CdnContentBuildService,
    CdnCourseBuildService,
    CdnLessonVideoBuildService,
    CdnModuleBuildService,
} from "./build"
import {
    ProcessCdnEntityStepService,
    ProcessCdnCompleteStepService,
} from "./steps"
import {
    SyncCdnStepMappingService,
} from "./step-mapping.service"
import {
    SyncCdnWorker,
} from "./sync-cdn.worker"

@Module({
    providers: [
        CdnCourseBuildService,
        CdnModuleBuildService,
        CdnChallengeBuildService,
        CdnContentBuildService,
        CdnLessonVideoBuildService,
        ProcessCdnEntityStepService,
        ProcessCdnCompleteStepService,
        SyncCdnStepMappingService,
        SyncCdnWorker,
    ],
    exports: [
        CdnCourseBuildService,
        CdnModuleBuildService,
        CdnChallengeBuildService,
        CdnContentBuildService,
        CdnLessonVideoBuildService,
    ],
})
export class SyncCdnModule extends ConfigurableModuleClass {
}
